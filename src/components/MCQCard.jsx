import { useState } from 'react'
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react'
import FormattedQuestionText, { renderInlineFormatted } from './FormattedQuestionText'
import { useLanguage } from '../context/LanguageContext'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

/**
 * Strips redundant leading option letters e.g. "A. ", "(a) ", "1. ", "(ఎ) "
 * so the card option button doesn't display "[A] A. Text".
 */
function sanitizeOptionText(opt) {
  if (!opt || typeof opt !== 'string') return opt || ''
  let cleaned = opt.replace(/^(?:[\(\[]?[A-Da-d1-4][\)\]\.\:\-]\s*)+/i, '').trim()
  cleaned = cleaned.replace(/^(?:[\(\[]?[ఎ|బి|సి|డి][\)\]\.\:\-]\s*)+/i, '').trim()
  return cleaned
}

/**
 * Parses and formats 360° multi-option explanations cleanly
 */
function renderStructuredExplanation(explanationText, t) {
  if (!explanationText) return null

  // Split lines by bullet or newline
  const lines = explanationText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  let correctSection = []
  let distractorsSection = []
  let memorySection = []
  let currentTarget = correctSection

  for (const line of lines) {
    if (
      line.startsWith('• Correct:') ||
      line.startsWith('• సరైన సమాధానం:') ||
      line.toLowerCase().includes('correct:') ||
      line.includes('సరైన సమాధానం')
    ) {
      currentTarget = correctSection
      correctSection.push(line.replace(/^[•\-\*]\s*(Correct|సరైన సమాధానం)[:\s]*/i, ''))
    } else if (
      line.startsWith('• Why other') ||
      line.startsWith('• మిగిలిన ఎంపికల') ||
      line.toLowerCase().includes('why other options') ||
      line.includes('మిగిలిన ఎంపికలు')
    ) {
      currentTarget = distractorsSection
    } else if (
      line.startsWith('• Memory Hook:') ||
      line.startsWith('• గుర్తుంచుకోవడానికి') ||
      line.toLowerCase().includes('memory hook:') ||
      line.includes('కీ పాయింట్')
    ) {
      currentTarget = memorySection
      memorySection.push(line.replace(/^[•\-\*]\s*(Memory Hook|గుర్తుంచుకోవడానికి కీ పాయింట్|కీ పాయింట్)[:\s]*/i, ''))
    } else {
      currentTarget.push(line)
    }
  }

  // If structured sections weren't detected, render cleanly as standard text
  if (distractorsSection.length === 0 && memorySection.length === 0) {
    return (
      <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-1)', margin: 0, whiteSpace: 'pre-line' }}>
        {renderInlineFormatted(explanationText)}
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* 1. Correct Option Rationale */}
      {correctSection.length > 0 && (
        <div style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--emerald-dim)', border: '1px solid var(--emerald-border)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>
            {t('prelims.whyCorrect', 'Why Correct')}
          </span>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-1)', margin: 0 }}>
            {renderInlineFormatted(correctSection.join(' '))}
          </p>
        </div>
      )}

      {/* 2. Distractor Analysis */}
      {distractorsSection.length > 0 && (
        <div style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--indigo)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
            {t('prelims.optionBreakdown', 'Option-by-Option Breakdown')}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {distractorsSection.map((dLine, idx) => (
              <div key={idx} style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-2)' }}>
                {renderInlineFormatted(dLine.startsWith('-') || dLine.startsWith('•') ? dLine : `• ${dLine}`)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Memory Hook / Takeaway */}
      {memorySection.length > 0 && (
        <div style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--gold-dim)', border: '1px solid var(--gold-border)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-hi)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>
            {t('prelims.memoryHook', 'Memory Hook')}
          </span>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-1)', margin: 0, fontWeight: 500 }}>
            {renderInlineFormatted(memorySection.join(' '))}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Detect and extract option sequence (A, B, C, D or ఎ, బి, సి, డి) from a question stem string.
 * Used to recover options when the LLM outputs options inside the question field and passes dummy options.
 */
function extractEmbeddedOptions(text) {
  if (!text || typeof text !== 'string') return null

  const optSeqRegex = /(?:([:\?\.\!])\s*|(?:\r?\n)+\s*|\s{2,}|\s+(?=\(?[A-Da-d]\b[\.\:\)\-]))\s*\(?(?:A|[ఎఏ])[\.\:\)\-\]]\s+((?:(?!List-|Column-|జాబితా|Select\b)[\s\S])+?)\s*\(?(?:B|బి)[\.\:\)\-\]]\s+((?:(?!List-|Column-|జాబితా|Select\b)[\s\S])+?)\s*\(?(?:C|సి)[\.\:\)\-\]]\s+((?:(?!List-|Column-|జాబితా|Select\b)[\s\S])+?)\s*\(?(?:D|డి)[\.\:\)\-\]]\s+((?:(?!List-|Column-|జాబితా|Select\b)[\s\S])+)$/i

  const match = text.match(optSeqRegex)
  if (!match) return null

  const delim = match[1] || ''
  let cleanStem = text.slice(0, match.index).trim()
  if (delim && !cleanStem.endsWith(delim)) {
    cleanStem += delim
  }

  return {
    cleanStem,
    optionsMap: {
      A: match[2].trim(),
      B: match[3].trim(),
      C: match[4].trim(),
      D: match[5].trim(),
    },
  }
}

const MCQCard = ({
  question,
  options,
  correctAnswer,
  explanation,
  type,
  pyqSource,
  difficulty,
  index,
  onAnswer,
}) => {
  const { t } = useLanguage()
  const [selectedOption, setSelectedOption] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  // Recover options if passed options are dummy placeholders (e.g. ['A', 'B', 'D', 'C'], empty strings, or length <= 2)
  const extracted = extractEmbeddedOptions(question)
  const cleanQuestion = extracted ? extracted.cleanStem : question

  const isDummyOptions = !options || options.length < 4 || options.every((opt) => {
    const s = typeof opt === 'string' ? opt.trim() : String(opt || '').trim()
    return s.length <= 2 || ['A', 'B', 'C', 'D', 'ఎ', 'బి', 'సి', 'డి'].includes(s.toUpperCase())
  })

  const effectiveOptions = (options || []).map((opt, i) => {
    const optStr = typeof opt === 'string' ? opt.trim() : String(opt || '').trim()
    const optUpper = optStr.toUpperCase()
    if (extracted?.optionsMap) {
      if (['A', 'B', 'C', 'D'].includes(optUpper)) {
        return extracted.optionsMap[optUpper] || extracted.optionsMap[OPTION_LABELS[i]] || optStr
      }
      if (['ఎ', 'బి', 'సి', 'డి'].includes(optStr)) {
        const teluguLetterMap = { 'ఎ': 'A', 'బి': 'B', 'సి': 'C', 'డి': 'D' }
        return extracted.optionsMap[teluguLetterMap[optStr]] || extracted.optionsMap[OPTION_LABELS[i]] || optStr
      }
      if (isDummyOptions || !optStr || optStr.length <= 2) {
        return extracted.optionsMap[OPTION_LABELS[i]] || optStr
      }
    }
    return optStr
  })

  const finalOptions = effectiveOptions.length === 4
    ? effectiveOptions
    : (extracted?.optionsMap ? OPTION_LABELS.map((k) => extracted.optionsMap[k]) : effectiveOptions)

  const handleSelect = (optionIndex) => {
    if (answered) return
    setSelectedOption(optionIndex)
    setAnswered(true)
    if (onAnswer) onAnswer(isCorrect(optionIndex))
    setTimeout(() => setShowExplanation(true), 300)
  }

  const isCorrect = (i) => i === correctAnswer || finalOptions[i] === correctAnswer
  const isSelected = (i) => i === selectedOption
  const userGotItRight = answered && isCorrect(selectedOption)

  const getOptionStyle = (i) => {
    if (!answered) return {
      background: 'var(--surface-elevated)',
      border: '1px solid var(--border)',
      color: 'var(--text-1)',
    }
    if (isCorrect(i)) return {
      background: 'var(--emerald-dim)',
      border: '1px solid var(--emerald-border)',
      color: 'var(--emerald)',
    }
    if (isSelected(i) && !isCorrect(i)) return {
      background: 'var(--red-dim)',
      border: '1px solid rgba(239,68,68,0.4)',
      color: 'var(--red)',
    }
    return {
      background: 'var(--surface-elevated)',
      border: '1px solid var(--border)',
      color: 'var(--text-3)',
    }
  }

  return (
    <div
      className="card"
      style={{
        padding: 'clamp(14px, 3.5vw, 20px)',
        animation: 'fadeIn 0.3s ease forwards',
        animationDelay: `${(index || 0) * 50}ms`,
        animationFillMode: 'both',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── Question stem with number badge ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <span
          style={{
            flexShrink: 0,
            width: 25,
            height: 25,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11.5,
            fontWeight: 700,
            background: answered
              ? userGotItRight ? 'var(--emerald-dim)' : 'var(--red-dim)'
              : 'var(--indigo-dim)',
            color: answered
              ? userGotItRight ? 'var(--emerald)' : 'var(--red)'
              : 'var(--indigo)',
            border: answered
              ? userGotItRight ? '1px solid var(--emerald-border)' : '1px solid rgba(239,68,68,0.3)'
              : '1px solid var(--indigo-border)',
            marginTop: 1,
          }}
        >
          {(index || 0) + 1}
        </span>
        <div style={{ flex: 1, minWidth: 0, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
          <FormattedQuestionText text={cleanQuestion} />
        </div>
      </div>

      {/* ── Options (A, B, C, D) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8, width: '100%' }}>
        {finalOptions.map((opt, i) => {
          const cleanOpt = sanitizeOptionText(opt)
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={answered}
              style={{
                ...getOptionStyle(i),
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 9,
                textAlign: 'left',
                cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
              onMouseEnter={(e) => { if (!answered) e.currentTarget.style.borderColor = 'var(--indigo)' }}
              onMouseLeave={(e) => { if (!answered) e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 23,
                  height: 23,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  background: answered && isCorrect(i)
                    ? 'var(--emerald-dim)'
                    : answered && isSelected(i)
                    ? 'var(--red-dim)'
                    : 'var(--border-soft)',
                  color: 'inherit',
                  border: '1px solid var(--border)',
                  marginTop: 1,
                }}
              >
                {OPTION_LABELS[i]}
              </span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, lineHeight: 1.45, wordBreak: 'break-word' }}>
                {renderInlineFormatted(cleanOpt)}
              </span>
              {answered && isCorrect(i) && <CheckCircle size={15} style={{ color: 'var(--emerald)', flexShrink: 0, marginTop: 3 }} />}
              {answered && isSelected(i) && !isCorrect(i) && <XCircle size={15} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 3 }} />}
            </button>
          )
        })}
      </div>

      {/* ── 360° Explanation ── */}
      {showExplanation && explanation && (
        <div style={{ marginTop: 14, borderRadius: 10, padding: '12px 14px', background: 'var(--surface-elevated)', border: '1px solid var(--border)', animation: 'fadeIn 0.25s ease forwards' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--gold-dim)', marginTop: 1 }}>
              <Lightbulb size={13} style={{ color: 'var(--gold-hi)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-hi)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('prelims.explanation', '360° Solution & Concept Analysis')}
              </p>
              {renderStructuredExplanation(explanation, t)}
            </div>
          </div>
        </div>
      )}

      {/* Toggle explanation button */}
      {answered && explanation && !showExplanation && (
        <button
          onClick={() => setShowExplanation(true)}
          style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--gold-hi)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <Lightbulb size={13} /> {t('prelims.showExplanation', 'Show 360° Solution & Distractor Analysis')}
        </button>
      )}
    </div>
  )
}

export default MCQCard
