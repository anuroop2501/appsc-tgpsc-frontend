import React from 'react'

/**
 * FormattedQuestionText
 * ─────────────────────────────────────────────────────────────
 * Parses and formats APPSC/UPSC statement-based questions cleanly.
 * Uses adaptive theme variables for seamless light & dark mode styling.
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
      <p className={className} style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, color: 'var(--text-1)', margin: 0 }}>
        {text}
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className={className}>
      {/* Intro Context */}
      {intro && (
        <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'var(--text-1)', margin: 0 }}>
          {intro}
        </p>
      )}

      {/* Structured Statement Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {statements.map((st, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--indigo-dim)',
                color: 'var(--indigo)',
                border: '1px solid var(--indigo-border)',
                marginTop: 2,
              }}
            >
              {st.num}
            </span>
            <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-1)', margin: 0, flex: 1 }}>
              {st.content}
            </p>
          </div>
        ))}
      </div>

      {/* Concluding Question Prompt */}
      {prompt && (
        <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--gold-hi)', margin: '4px 0 0' }}>
          {prompt}
        </p>
      )}
    </div>
  )
}
