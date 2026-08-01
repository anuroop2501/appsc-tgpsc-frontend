import React from 'react'

/**
 * FormattedQuestionText
 * ─────────────────────────────────────────────────────────────
 * Parses and formats APPSC/UPSC statement-based questions cleanly.
 * Strictly validates that statement markers form a sequential list (1, 2, 3... or I, II, III... or i, ii, iii...).
 * Eliminates false positives on years (e.g. 2020), amounts (e.g. 5171), or random numbers in text.
 */
export function parseQuestionText(text = '') {
  if (!text || typeof text !== 'string') return { intro: '', statements: [], prompt: text || '' }

  let raw = text.trim()

  // Match prompt at the end (e.g. "Which of the statements given above is/are correct?")
  const promptMatch = raw.match(/\s+((?:Which|Select|What)[^?]*\?)/i)
  let prompt = ''
  if (promptMatch) {
    prompt = promptMatch[1].trim()
    raw = raw.slice(0, promptMatch.index).trim()
  }

  // Regex to match candidate statement markers at start of text or following whitespace/punctuation:
  // e.g. "1. ", "2. ", "3. ", "(1) ", "(2) ", "(i) ", "I. "
  const statementRegex = /(?:^|[\n;\.]\s*|\s+)\(?([1-9]|10|[iI]{1,3}|[vV]|[xX]|IV|VI)\)?[\.:\)]\s+/g
  const matches = [...raw.matchAll(statementRegex)]

  if (matches.length >= 2) {
    // Check if numbers are strictly sequential starting at 1
    const isSequentialDigits = matches.every((m, idx) => {
      const val = parseInt(m[1], 10)
      return !isNaN(val) && val === idx + 1
    })

    const isSequentialRomanUpper = matches.every((m, idx) => {
      const romanOrder = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
      return m[1].toUpperCase() === romanOrder[idx]
    })

    const isSequentialRomanLower = matches.every((m, idx) => {
      const romanOrder = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']
      return m[1].toLowerCase() === romanOrder[idx]
    })

    if (isSequentialDigits || isSequentialRomanUpper || isSequentialRomanLower) {
      const firstIndex = matches[0].index
      const intro = raw.slice(0, firstIndex).trim()

      const statements = []
      for (let i = 0; i < matches.length; i++) {
        const num = isSequentialDigits ? `${i + 1}` : matches[i][1]
        const startPos = matches[i].index + matches[i][0].length
        const endPos = (i < matches.length - 1) ? matches[i + 1].index : raw.length
        let content = raw.slice(startPos, endPos).trim()

        // Strip any duplicated leading marker inside content if present
        content = content.replace(/^(?:\(?\d+\)?[\.:\)]\s*)+/, '').trim()

        if (content) {
          statements.push({ num, content })
        }
      }

      if (statements.length >= 2) {
        return { intro, statements, prompt }
      }
    }
  }

  return { intro: '', statements: [], prompt: text }
}

export default function FormattedQuestionText({ text, className = '' }) {
  const { intro, statements, prompt } = parseQuestionText(text)

  if (statements.length === 0) {
    return (
      <p className={`text-sm font-medium leading-relaxed ${className}`} style={{ color: 'var(--color-text)' }}>
        {text}
      </p>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Intro Context */}
      {intro && (
        <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--color-text)', fontFamily: 'Sora, sans-serif' }}>
          {intro}
        </p>
      )}

      {/* Structured Statement Cards */}
      <div className="space-y-2 pl-1">
        {statements.map((st, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 rounded-xl transition-all"
            style={{
              background: 'rgba(21, 32, 54, 0.6)',
              border: '1px solid rgba(37, 99, 235, 0.25)',
            }}
          >
            <span
              className="flex-shrink-0 w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center mt-0.5"
              style={{
                background: 'rgba(37, 99, 235, 0.25)',
                color: '#60A5FA',
                border: '1px solid rgba(37, 99, 235, 0.4)',
                fontFamily: 'Sora, sans-serif',
              }}
            >
              {st.num}
            </span>
            <p className="text-xs sm:text-sm leading-relaxed flex-1" style={{ color: 'var(--color-text)' }}>
              {st.content}
            </p>
          </div>
        ))}
      </div>

      {/* Concluding Question Prompt */}
      {prompt && (
        <p className="text-xs sm:text-sm font-bold pt-1" style={{ color: '#F7B500', fontFamily: 'Sora, sans-serif' }}>
          {prompt}
        </p>
      )}
    </div>
  )
}
