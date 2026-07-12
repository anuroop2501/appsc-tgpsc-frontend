import { useState } from 'react'
import { CheckCircle, XCircle, Lightbulb, ChevronDown } from 'lucide-react'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

const MCQCard = ({ question, options, correctAnswer, explanation, index }) => {
  const [selectedOption, setSelectedOption] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const handleSelect = (optionIndex) => {
    if (answered) return
    setSelectedOption(optionIndex)
    setAnswered(true)
    setTimeout(() => setShowExplanation(true), 300)
  }

  const isCorrect = (i) => i === correctAnswer || options[i] === correctAnswer
  const isSelected = (i) => i === selectedOption

  const getOptionStyle = (i) => {
    if (!answered) {
      return {
        background: 'rgba(42, 52, 80, 0.4)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text)',
      }
    }
    if (isCorrect(i)) {
      return {
        background: 'rgba(61, 214, 140, 0.12)',
        border: '1px solid rgba(61, 214, 140, 0.6)',
        color: '#3DD68C',
      }
    }
    if (isSelected(i) && !isCorrect(i)) {
      return {
        background: 'rgba(247, 111, 111, 0.12)',
        border: '1px solid rgba(247, 111, 111, 0.6)',
        color: '#F76F6F',
      }
    }
    return {
      background: 'rgba(26, 32, 53, 0.4)',
      border: '1px solid rgba(42, 52, 80, 0.4)',
      color: 'var(--color-muted)',
    }
  }

  const getOptionIcon = (i) => {
    if (!answered) return null
    if (isCorrect(i)) return <CheckCircle size={16} style={{ color: '#3DD68C', flexShrink: 0 }} />
    if (isSelected(i) && !isCorrect(i)) return <XCircle size={16} style={{ color: '#F76F6F', flexShrink: 0 }} />
    return null
  }

  const userGotItRight = answered && isCorrect(selectedOption)

  return (
    <div
      className="glass-card p-5 animate-slide-up"
      style={{ animationDelay: `${(index || 0) * 60}ms`, animationFillMode: 'both' }}
    >
      {/* ── Header ── */}
      <div className="flex items-start gap-3 mb-4">
        <span
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{
            background: answered
              ? userGotItRight
                ? 'rgba(61, 214, 140, 0.2)'
                : 'rgba(247, 111, 111, 0.2)'
              : 'rgba(79, 142, 247, 0.2)',
            color: answered
              ? userGotItRight
                ? '#3DD68C'
                : '#F76F6F'
              : 'var(--color-accent)',
            fontFamily: 'Sora, sans-serif',
          }}
        >
          {(index || 0) + 1}
        </span>
        <p
          className="text-sm font-medium leading-relaxed flex-1"
          style={{ color: 'var(--color-text)' }}
        >
          {question}
        </p>
      </div>

      {/* ── Options ── */}
      <div className="space-y-2.5">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={answered}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200"
            style={{
              ...getOptionStyle(i),
              cursor: answered ? 'default' : 'pointer',
              transform: !answered ? undefined : undefined,
            }}
          >
            <span
              className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                background: answered && isCorrect(i)
                  ? 'rgba(61, 214, 140, 0.25)'
                  : answered && isSelected(i)
                  ? 'rgba(247, 111, 111, 0.25)'
                  : 'rgba(42, 52, 80, 0.6)',
                color: 'inherit',
                fontFamily: 'Sora, sans-serif',
              }}
            >
              {OPTION_LABELS[i]}
            </span>
            <span className="flex-1 text-sm">{opt}</span>
            {getOptionIcon(i)}
          </button>
        ))}
      </div>

      {/* ── Explanation ── */}
      {showExplanation && explanation && (
        <div
          className="mt-4 rounded-xl p-4 animate-slide-down"
          style={{
            background: 'rgba(79, 142, 247, 0.07)',
            border: '1px solid rgba(79, 142, 247, 0.2)',
          }}
        >
          <div className="flex items-start gap-2.5">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(245, 166, 35, 0.2)' }}
            >
              <Lightbulb size={13} style={{ color: 'var(--color-gold)' }} />
            </div>
            <div>
              <p
                className="text-xs font-semibold mb-1"
                style={{ color: 'var(--color-gold)', fontFamily: 'Sora, sans-serif' }}
              >
                Explanation
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                {explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Toggle explanation (after answered) ── */}
      {answered && explanation && !showExplanation && (
        <button
          onClick={() => setShowExplanation(true)}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--color-accent)' }}
        >
          <Lightbulb size={13} />
          Show Explanation
          <ChevronDown size={13} />
        </button>
      )}
    </div>
  )
}

export default MCQCard
