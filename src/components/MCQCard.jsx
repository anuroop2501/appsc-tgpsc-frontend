import { useState } from 'react'
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react'
import FormattedQuestionText from './FormattedQuestionText'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

const MCQCard = ({ question, options, correctAnswer, explanation, index, onAnswer }) => {
  const [selectedOption, setSelectedOption] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

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

  return (
    <div
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
        padding: 20, animation: 'fadeIn 0.3s ease forwards',
        animationDelay: `${(index || 0) * 60}ms`, animationFillMode: 'both',
      }}
    >
      {/* ── Question header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <span
          style={{
            flexShrink: 0, width: 26, height: 26, borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11.5, fontFamily: 'var(--font-mono)', fontWeight: 600,
            background: answered
              ? userGotItRight ? 'var(--emerald-dim)' : 'var(--red-dim)'
              : 'var(--indigo-dim)',
            color: answered
              ? userGotItRight ? 'var(--emerald)' : 'var(--red)'
              : 'var(--indigo)',
          }}
        >
          {(index || 0) + 1}
        </span>
        <div style={{ flex: 1 }}>
          <FormattedQuestionText text={question} />
        </div>
      </div>

      {/* ── Options ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
              fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
              background: answered && isCorrect(i)
                ? 'rgba(51,165,131,0.25)'
                : answered && isSelected(i)
                ? 'rgba(239,68,68,0.25)'
                : 'var(--border)',
              color: 'inherit',
            }}>
              {OPTION_LABELS[i]}
            </span>
            <span style={{ flex: 1, fontSize: 13.5 }}>{opt}</span>
            {answered && isCorrect(i) && <CheckCircle size={15} style={{ color: 'var(--emerald)', flexShrink: 0 }} />}
            {answered && isSelected(i) && !isCorrect(i) && <XCircle size={15} style={{ color: 'var(--red)', flexShrink: 0 }} />}
          </button>
        ))}
      </div>

      {/* ── Explanation ── */}
      {showExplanation && explanation && (
        <div style={{ marginTop: 14, borderRadius: 10, padding: '12px 14px', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', animation: 'fadeIn 0.25s ease forwards' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(201,164,48,0.2)' }}>
              <Lightbulb size={13} style={{ color: 'var(--gold-hi)' }} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-hi)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Explanation</p>
              <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-1)', margin: 0 }}>{explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle explanation */}
      {answered && explanation && !showExplanation && (
        <button onClick={() => setShowExplanation(true)} style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--gold-hi)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Lightbulb size={13} /> Show Explanation
        </button>
      )}
    </div>
  )
}

export default MCQCard
