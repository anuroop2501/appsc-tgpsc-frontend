import { useState } from 'react'
import { CheckCircle, XCircle, Lightbulb, Zap, Bookmark, Link as LinkIcon, Clock, Layers, HelpCircle, Info, BookOpen } from 'lucide-react'
import FormattedQuestionText from './FormattedQuestionText'
import { useLanguage } from '../context/LanguageContext'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

const TYPE_CONFIG = {
  match_the_following: { label: 'Match The Following', icon: LinkIcon, color: '#4F8EF7', bg: 'rgba(79,142,247,0.12)' },
  chronology: { label: 'Chronology', icon: Clock, color: '#F5A623', bg: 'rgba(245,166,35,0.12)' },
  odd_one_out: { label: 'Odd One Out', icon: HelpCircle, color: '#F76F6F', bg: 'rgba(247,111,111,0.12)' },
  direct: { label: 'Direct Concept', icon: Zap, color: '#3DD68C', bg: 'rgba(61,214,140,0.12)' },
  statement: { label: 'Statement Based', icon: Layers, color: '#7B5EF8', bg: 'rgba(123,94,248,0.12)' },
  assertion_reason: { label: 'Assertion & Reason', icon: Bookmark, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
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
      <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-1)', margin: 0 }}>
        {explanationText}
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* 1. Correct Option Rationale (Clean, No Icon) */}
      {correctSection.length > 0 && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--emerald-dim)', border: '1px solid var(--emerald-border)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
            {t('prelims.whyCorrect', 'Why Correct')}
          </span>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-1)', margin: 0 }}>
            {correctSection.join(' ')}
          </p>
        </div>
      )}

      {/* 2. Distractor Analysis (Clean, No Search Icon, No Subtitle Text) */}
      {distractorsSection.length > 0 && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--indigo)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
            {t('prelims.optionBreakdown', 'Option-by-Option Breakdown')}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {distractorsSection.map((dLine, idx) => (
              <div key={idx} style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-2)' }}>
                {dLine.startsWith('-') || dLine.startsWith('•') ? dLine : `• ${dLine}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Memory Hook / Takeaway */}
      {memorySection.length > 0 && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--gold-dim)', border: '1px solid var(--gold-border)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-hi)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
            {t('prelims.memoryHook', 'Memory Hook')}
          </span>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-1)', margin: 0, fontWeight: 500 }}>
            {memorySection.join(' ')}
          </p>
        </div>
      )}
    </div>
  )
}

const MCQCard = ({ question, options, correctAnswer, explanation, type, pyqSource, reference, index, onAnswer }) => {
  const { t } = useLanguage()
  const [selectedOption, setSelectedOption] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [showReference, setShowReference] = useState(false)

  const handleSelect = (optionIndex) => {
    if (answered) return
    setSelectedOption(optionIndex)
    setAnswered(true)
    if (onAnswer) onAnswer(isCorrect(optionIndex))
    setTimeout(() => setShowExplanation(true), 300)
  }

  const isCorrect = (i) => i === correctAnswer || options[i] === correctAnswer
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

  const typeMeta = TYPE_CONFIG[type] || null
  const TypeIcon = typeMeta ? typeMeta.icon : null

  return (
    <div
      className="card"
      style={{
        padding: 22, animation: 'fadeIn 0.3s ease forwards',
        animationDelay: `${(index || 0) * 60}ms`, animationFillMode: 'both',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* ── Header Toolbar (Reference Button Always Available) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button
          onClick={() => setShowReference(!showReference)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 9px',
            borderRadius: 6,
            fontSize: 11.5,
            fontWeight: 600,
            color: showReference ? 'var(--indigo)' : 'var(--text-3)',
            background: showReference ? 'var(--indigo-dim)' : 'transparent',
            border: `1px solid ${showReference ? 'var(--indigo-border)' : 'var(--border)'}`,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={t('prelims.checkReferences', 'Check Textbook Reference')}
        >
          <Info size={12.5} />
          <span>{t('prelims.reference', 'Reference')}</span>
        </button>
      </div>

      {/* ── Collapsible Reference Box ── */}
      {showReference && (
        <div
          style={{
            padding: '9px 12px',
            borderRadius: 8,
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            fontSize: 12,
            color: 'var(--text-1)',
            marginBottom: 14,
            animation: 'fadeIn 0.2s ease forwards',
          }}
        >
          <BookOpen size={14} style={{ color: 'var(--indigo)', flexShrink: 0 }} />
          <span><strong>{t('prelims.standardSource', 'Standard Source')}:</strong> {reference || 'Standard Reference (NCERT / Telugu Academy / M. Laxmikanth / Official Syllabus)'}</span>
        </div>
      )}

      {/* ── Question header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <span
          style={{
            flexShrink: 0, width: 26, height: 26, borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
            background: answered
              ? userGotItRight ? 'var(--emerald-dim)' : 'var(--red-dim)'
              : 'var(--indigo-dim)',
            color: answered
              ? userGotItRight ? 'var(--emerald)' : 'var(--red)'
              : 'var(--indigo)',
            border: answered
              ? userGotItRight ? '1px solid var(--emerald-border)' : '1px solid rgba(239,68,68,0.3)'
              : '1px solid var(--indigo-border)',
          }}
        >
          {(index || 0) + 1}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <FormattedQuestionText text={question} />
        </div>
      </div>

      {/* ── Options ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={answered}
            style={{
              ...getOptionStyle(i),
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10, textAlign: 'left',
              cursor: answered ? 'default' : 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { if (!answered) e.currentTarget.style.borderColor = 'var(--indigo)' }}
            onMouseLeave={e => { if (!answered) e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <span style={{
              flexShrink: 0, width: 22, height: 22, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11.5, fontWeight: 700,
              background: answered && isCorrect(i)
                ? 'var(--emerald-dim)'
                : answered && isSelected(i)
                ? 'var(--red-dim)'
                : 'var(--border-soft)',
              color: 'inherit',
              border: '1px solid var(--border)',
            }}>
              {OPTION_LABELS[i]}
            </span>
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{opt}</span>
            {answered && isCorrect(i) && <CheckCircle size={15} style={{ color: 'var(--emerald)', flexShrink: 0 }} />}
            {answered && isSelected(i) && !isCorrect(i) && <XCircle size={15} style={{ color: 'var(--red)', flexShrink: 0 }} />}
          </button>
        ))}
      </div>

      {/* ── 360° Explanation ── */}
      {showExplanation && explanation && (
        <div style={{ marginTop: 14, borderRadius: 10, padding: '14px 16px', background: 'var(--surface-elevated)', border: '1px solid var(--border)', animation: 'fadeIn 0.25s ease forwards' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--gold-dim)' }}>
              <Lightbulb size={13} style={{ color: 'var(--gold-hi)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-hi)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('prelims.explanation', '360° Solution & Concept Analysis')}
              </p>
              {renderStructuredExplanation(explanation, t)}
            </div>
          </div>
        </div>
      )}

      {/* Toggle explanation */}
      {answered && explanation && !showExplanation && (
        <button onClick={() => setShowExplanation(true)} style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--gold-hi)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Lightbulb size={13} /> {t('prelims.showExplanation', 'Show 360° Solution & Distractor Analysis')}
        </button>
      )}
    </div>
  )
}

export default MCQCard

