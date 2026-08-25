import React from 'react'
import { ArrowRight, Link as LinkIcon, Clock, HelpCircle, Layers, CheckSquare } from 'lucide-react'

function parseListItems(listText, isAlpha = true) {
  if (!listText) return []
  const text = listText.trim()

  // Marker regex: matches (A), A., A:, A) or (1), 1., 1:, 1)
  const markerRegex = isAlpha
    ? /(?:^|\s+)\(?([A-Da-d])\)?[.:\)]\s*/g
    : /(?:^|\s+)\(?([1-9]|10|[ivxIVX]{1,3})\)?[.:\)]\s*/g

  const matches = [...text.matchAll(markerRegex)]
  if (matches.length < 2) return []

  const items = []
  for (let i = 0; i < matches.length; i++) {
    const label = matches[i][1].toUpperCase()
    const startPos = matches[i].index + matches[i][0].length
    const endPos = i < matches.length - 1 ? matches[i + 1].index : text.length
    const content = text.slice(startPos, endPos).trim().replace(/^[:\-\.]\s*/, '')
    if (content) {
      items.push({ label, text: content })
    }
  }
  return items
}

/**
 * FormattedQuestionText
 * ─────────────────────────────────────────────────────────────
 * Parses and formats diverse APPSC/UPSC question types cleanly:
 * 1. Match the Following (2-column comparison table)
 * 2. Assertion-Reason (A & R cards)
 * 3. Chronology based questions (timeline sequence)
 * 4. Statement-based questions (1, 2, 3...)
 * 5. Direct / Odd-one-out questions
 */
export function parseQuestionText(text = '') {
  if (!text || typeof text !== 'string') return { format: 'direct', intro: '', prompt: text || '' }

  const raw = text.trim()
  const isTelugu = /[\u0C00-\u0C7F]/.test(raw)

  // ── 1. Match the Following Pattern (List-I vs List-II, Column-A vs Column-B, స్తంభం A vs స్తంభం B, or Row-paired) ──
  // Extract concluding prompt first
  const promptRegex = /(?:^|[\n\.\?!]|\s+)((?:Which\s+of\s+the|Select\s+the|Choose\s+the|What\s+is|In\s+the\s+context|కింది\s*ఎంపికలలో|క్రింది\s*వాటిలో|పై\s*వాటిలో|సరైన\s*జతలు|సరైన\s*కోడ్|సరైన\s*సమాధానం|కోడ్)[^?:]*[\?:]\s*)$/i
  let prompt = 'Select the correct code:'
  let bodyText = raw

  const pMatch = raw.match(promptRegex)
  if (pMatch) {
    prompt = pMatch[1].trim()
    bodyText = raw.slice(0, pMatch.index).trim()
  }

  // 1a. Standard Two-Block Match Pattern (List-I ... List-II ...)
  const list1Regex = /(?:List|Column|జాబితా|స్తంభం|కాలమ్)\s*[-–:\.]?\s*(?:I|1|A)\b\s*(\([^)]*\))?[:\s]*/gi
  const list2Regex = /(?:List|Column|జాబితా|స్తంభం|కాలమ్)\s*[-–:\.]?\s*(?:II|2|B)\b\s*(\([^)]*\))?[:\s]*/gi

  const matches1 = [...bodyText.matchAll(list1Regex)]
  const matches2 = [...bodyText.matchAll(list2Regex)]

  if (matches1.length > 0 && matches2.length > 0) {
    for (let i = matches1.length - 1; i >= 0; i--) {
      const m1 = matches1[i]
      for (const m2 of matches2) {
        if (m1.index >= m2.index) continue

        const list1Raw = bodyText.slice(m1.index + m1[0].length, m2.index).trim()
        const list2Raw = bodyText.slice(m2.index + m2[0].length).trim()

        // Try both digit -> alpha and alpha -> digit orderings
        let list1 = parseListItems(list1Raw, false)
        let list2 = parseListItems(list2Raw, true)

        if (list1.length < 2 || list2.length < 2) {
          list1 = parseListItems(list1Raw, true)
          list2 = parseListItems(list2Raw, false)
        }

        if (list1.length >= 2 && list2.length >= 2) {
          let intro = bodyText.slice(0, m1.index).trim()
          if (!intro || intro.toLowerCase() === 'match' || intro.length < 5) {
            intro = 'Match List-I with List-II:'
          }

          const list1Header = m1[1] ? `List-I ${m1[1]}` : (m1[0].trim().replace(/[:\s]+$/, '') || 'List-I')
          const list2Header = m2[1] ? `List-II ${m2[1]}` : (m2[0].trim().replace(/[:\s]+$/, '') || 'List-II')

          return {
            format: 'match_the_following',
            intro,
            list1Title: list1Header,
            list2Title: list2Header,
            list1,
            list2,
            prompt,
          }
        }
      }
    }
  }

  // 1b. Alternating Row-Paired Match Pattern ONLY IF rows contain pipes '|' AND question has match keywords
  const isMatchIntent = /(?:Match|సరిపోల్చండి|జతలను|జతపరచండి|స్తంభం|జాబితా|Column)/i.test(bodyText)
  if (isMatchIntent && bodyText.includes('|')) {
    const markerRegex = /(?:^|[\n\s]+)\(?([1-9]|10|[A-Da-d])\)?[.:\)]\s*/g
    const markerMatches = [...bodyText.matchAll(markerRegex)]

    if (markerMatches.length >= 4) {
      const items = []
      for (let i = 0; i < markerMatches.length; i++) {
        const label = markerMatches[i][1]
        const startPos = markerMatches[i].index + markerMatches[i][0].length
        const endPos = i < markerMatches.length - 1 ? markerMatches[i + 1].index : bodyText.length
        const content = bodyText.slice(startPos, endPos).trim().replace(/[\|\-–—]\s*$/, '').trim()
        items.push({ label, text: content })
      }

      // Must be alternating: even indices are digits, odd indices are letters (1, a, 2, b, 3, c, 4, d)
      const isDigitLetterAlternating = items.length >= 4 && items.length % 2 === 0 &&
        items.every((it, idx) => (idx % 2 === 0 ? /^\d+$/.test(it.label) : /^[a-zA-Z]$/.test(it.label)))

      const isLetterDigitAlternating = items.length >= 4 && items.length % 2 === 0 &&
        items.every((it, idx) => (idx % 2 === 0 ? /^[a-zA-Z]$/.test(it.label) : /^\d+$/.test(it.label)))

      if (isDigitLetterAlternating || isLetterDigitAlternating) {
        const introAndHeaders = bodyText.slice(0, markerMatches[0].index).trim()
        let list1Title = 'List-I'
        let list2Title = 'List-II'
        let intro = 'Match List-I with List-II:'

        if (introAndHeaders.includes('|')) {
          const parts = introAndHeaders.split('|')
          list1Title = parts[0].replace(/^(?:కింది|క్రింది|Match)?\s*(?:జతలను|the)?\s*(?:సరిపోల్చండి|following)?[:\s]*/i, '').trim() || 'List-I'
          list2Title = parts[1].trim() || 'List-II'
          const isTelugu = /[\u0C00-\u0C7F]/.test(bodyText)
          intro = isTelugu ? 'కింది జతలను సరిపోల్చండి:' : 'Match the following:'
        } else {
          intro = introAndHeaders || 'Match List-I with List-II:'
        }

        const list1 = []
        const list2 = []
        for (let i = 0; i < items.length; i += 2) {
          list1.push(items[i])
          list2.push(items[i + 1])
        }

        return {
          format: 'match_the_following',
          intro,
          list1Title,
          list2Title,
          list1,
          list2,
          prompt,
        }
      }
    }
  }

  // ── 2. Assertion-Reason Pattern (English & Telugu) ───────────────────────
  const arRegex = /(?:Assertion\s*(?:\([A|a]\)|:)|ప్రతిపాదన\s*(?:\([A|a]\)|:)|ప్రకటన\s*(?:\([A|a]\)|:)|వాదన\s*(?:\([A|a]\)|:))[:\s]+([\s\S]+?)(?:Reason\s*(?:\([R|r]\)|:)|హేతువు\s*(?:\([R|r]\)|:)|కారణం\s*(?:\([R|r]\)|:)|కారణము\s*(?:\([R|r]\)|:))[:\s]+([\s\S]+)$/i
  const arMatch = raw.match(arRegex)
  if (arMatch) {
    const assertionText = arMatch[1].trim()
    let reasonText = arMatch[2].trim()
    let prompt = ''

    // Match concluding prompt (e.g. "కింది ఎంపికలలో సరైనది ఏది?", "Select the correct option:", etc.)
    const promptRegex = /(?:^|[\n\.\?!]|\s+)((?:Which\s+of\s+the|Select\s+the|Choose\s+the|What\s+is|In\s+the\s+context|కింది\s*ఎంపికలలో|క్రింది\s*వాటిలో|పై\s*వాటిలో|సరైనది|సరైన\s*ఎంపిక|సరైన\s*కోడ్|కోడ్)[^?:]*[\?:]\s*)$/i
    const promptMatch = reasonText.match(promptRegex)
    if (promptMatch) {
      prompt = promptMatch[1].trim()
      reasonText = reasonText.slice(0, promptMatch.index).trim()
    }

    // Strip any embedded options block like "Select the correct code: (A) Both A and R are true... (B) ... (C) ... (D) ..."
    const optionsBlockRegex = /(?:\n|\.\s+|\?\s+|\:\s+|\s+)\b(?:(?:Select|Choose|Match)\s+(?:the\s+)?correct\s+(?:option|code|answer)|In\s+the\s+context|Codes|Options|సరైన\s*కోడ్|ఎంపికలు)[\s\S]*$/i
    const optBlockMatch = reasonText.match(optionsBlockRegex)
    if (optBlockMatch) {
      reasonText = reasonText.slice(0, optBlockMatch.index).trim()
    }

    // Also strip trailing raw (A) ... (B) ... (C) ... (D) if prompt keyword wasn't present
    reasonText = reasonText.replace(/(?:^|\s+)\(?[A-Da-d]\)[\s\S]+$/, '').trim()
    reasonText = reasonText.replace(/[:\-–]\s*$/, '').trim()

    let intro = raw.slice(0, arMatch.index).trim()
    if (!intro || intro.length < 3) {
      intro = isTelugu ? 'క్రింది ప్రకటనలను చదవండి:' : 'Read the following statements:'
    }

    return {
      format: 'assertion_reason',
      intro,
      assertion: assertionText,
      reason: reasonText,
      prompt: prompt || (isTelugu ? 'సరైన ఎంపికను ఎంచుకోండి:' : 'Select the correct option:'),
    }
  }

  // ── 3. Chronology / Timeline Pattern ─────────────────────
  const isChronology = /\b(chronological|chronology|కాలక్రమ|sequence|order of occurrence)\b/i.test(raw)

  // ── 4. Statement-based Pattern (1. 2. 3...) ───────────────
  // Concluding prompt regex: strictly match ending question sentence starting with prompt keywords
  const stmtPromptRegex = /(?:^|[\n\.\?!])\s*(\b(?:Which\s+of\s+the|Select\s+the|Choose\s+the|What\s+is|In\s+the\s+context|క్రింది\s*వాటిలో|పై\s*వాటిలో|సరైన)[^?]*\?)\s*$/i
  let stmtPrompt = ''
  let contentBeforePrompt = raw

  const promptMatch = raw.match(stmtPromptRegex)
  if (promptMatch) {
    stmtPrompt = promptMatch[1].trim()
    contentBeforePrompt = raw.slice(0, raw.lastIndexOf(promptMatch[1])).trim()
  }

  const statementRegex = /(?:^|[\n;\.]\s*|\s+)\(?([1-9]|10|[iI]{1,3}|[vV]|[xX]|IV|VI)\)?[\.:\)]\s+/g
  const matches = [...contentBeforePrompt.matchAll(statementRegex)]

  if (matches.length >= 2) {
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
      const intro = contentBeforePrompt.slice(0, firstIndex).trim()

      const statements = []
      for (let i = 0; i < matches.length; i++) {
        const num = isSequentialDigits ? `${i + 1}` : matches[i][1]
        const startPos = matches[i].index + matches[i][0].length
        const endPos = (i < matches.length - 1) ? matches[i + 1].index : contentBeforePrompt.length
        let itemContent = contentBeforePrompt.slice(startPos, endPos).trim()
        itemContent = itemContent.replace(/^(?:\(?\d+\)?[\.:\)]\s*)+/, '').trim()

        if (itemContent) {
          statements.push({ num, content: itemContent })
        }
      }

      if (statements.length >= 2) {
        return {
          format: isChronology ? 'chronology' : 'statement',
          intro: intro || (isChronology ? 'Arrange the following in chronological order:' : 'Consider the following statements:'),
          statements,
          prompt: stmtPrompt || prompt,
        }
      }
    }
  }

  // ── 5. Default Direct Question ───────────────────────────
  return { format: 'direct', intro: '', statements: [], prompt: text }
}

export default function FormattedQuestionText({ text, className = '' }) {
  const parsed = parseQuestionText(text)

  // ── Match the Following: 2-Column Table UI ────────────────
  if (parsed.format === 'match_the_following') {
    const maxRows = Math.max(parsed.list1.length, parsed.list2.length)
    const rows = Array.from({ length: maxRows }).map((_, i) => ({
      item1: parsed.list1[i] || null,
      item2: parsed.list2[i] || null,
    }))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className={className}>
        {parsed.intro && (
          <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'var(--text-1)', margin: 0 }}>
            {parsed.intro}
          </p>
        )}

        {/* 2-Column Structured Table */}
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-elevated)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(79, 142, 247, 0.08)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 14px', width: '50%', fontSize: 12, fontWeight: 700, color: 'var(--indigo)', borderRight: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {parsed.list1Title || 'List-I'}
                </th>
                <th style={{ padding: '10px 14px', width: '50%', fontSize: 12, fontWeight: 700, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {parsed.list2Title || 'List-II'}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: idx < rows.length - 1 ? '1px solid var(--border)' : 'none',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  {/* Left Column (List I) */}
                  <td style={{ padding: '11px 14px', verticalAlign: 'top', borderRight: '1px solid var(--border)', fontSize: 13.5, color: 'var(--text-1)' }}>
                    {row.item1 && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{
                          flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                          background: 'var(--indigo-dim)', color: 'var(--indigo)',
                          border: '1px solid var(--indigo-border)', fontSize: 11.5,
                          fontWeight: 700, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', marginTop: 1,
                        }}>
                          {row.item1.label}
                        </span>
                        <span style={{ lineHeight: 1.5, flex: 1, fontWeight: 500 }}>{row.item1.text}</span>
                      </div>
                    )}
                  </td>

                  {/* Right Column (List II) */}
                  <td style={{ padding: '11px 14px', verticalAlign: 'top', fontSize: 13.5, color: 'var(--text-1)' }}>
                    {row.item2 && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{
                          flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                          background: 'var(--emerald-dim)', color: 'var(--emerald)',
                          border: '1px solid var(--emerald-border)', fontSize: 11.5,
                          fontWeight: 700, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', marginTop: 1,
                        }}>
                          {row.item2.label}
                        </span>
                        <span style={{ lineHeight: 1.5, flex: 1, fontWeight: 500 }}>{row.item2.text}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {parsed.prompt && (
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', margin: '2px 0 0' }}>
            {parsed.prompt}
          </p>
        )}
      </div>
    )
  }

  // ── Assertion & Reason UI ────────────────────────────────
  if (parsed.format === 'assertion_reason') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className={className}>
        {parsed.intro && (
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>
            {parsed.intro}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Assertion (A) Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 9,
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'var(--indigo-dim)',
                color: 'var(--indigo)',
                border: '1px solid var(--indigo-border)',
                marginTop: 1,
              }}
            >
              Assertion (A)
            </span>
            <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-1)', margin: 0, flex: 1 }}>
              {parsed.assertion}
            </p>
          </div>

          {/* Reason (R) Card on a new line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 9,
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(6,182,212,0.12)',
                color: '#06B6D4',
                border: '1px solid rgba(6,182,212,0.3)',
                marginTop: 1,
              }}
            >
              Reason (R)
            </span>
            <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-1)', margin: 0, flex: 1 }}>
              {parsed.reason}
            </p>
          </div>
        </div>

        {parsed.prompt && (
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: '2px 0 0' }}>
            {parsed.prompt}
          </p>
        )}
      </div>
    )
  }

  // ── Chronology / Timeline UI ─────────────────────────────
  if (parsed.format === 'chronology') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className={className}>
        {parsed.intro && (
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} style={{ color: 'var(--indigo)' }} /> {parsed.intro}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {parsed.statements.map((st, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
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
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--indigo-dim)',
                  color: 'var(--indigo)',
                  border: '1px solid var(--indigo-border)',
                }}
              >
                {st.num}
              </span>
              <p style={{ fontSize: 13.5, color: 'var(--text-1)', margin: 0, flex: 1 }}>
                {st.content}
              </p>
            </div>
          ))}
        </div>

        {parsed.prompt && (
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: '2px 0 0' }}>
            {parsed.prompt}
          </p>
        )}
      </div>
    )
  }

  // ── Statement Cards UI ───────────────────────────────────
  if (parsed.statements?.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className={className}>
        {parsed.intro && (
          <p style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, color: 'var(--text-1)', margin: 0 }}>
            {parsed.intro}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {parsed.statements.map((st, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--indigo-dim)',
                  color: 'var(--indigo)',
                  border: '1px solid var(--indigo-border)',
                  marginTop: 1,
                }}
              >
                {st.num}
              </span>
              <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--text-1)', margin: 0, flex: 1 }}>
                {st.content}
              </p>
            </div>
          ))}
        </div>

        {parsed.prompt && (
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: '2px 0 0' }}>
            {parsed.prompt}
          </p>
        )}
      </div>
    )
  }

  // ── Default / Direct Question UI ─────────────────────────
  return (
    <p className={className} style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, color: 'var(--text-1)', margin: 0 }}>
      {text}
    </p>
  )
}

