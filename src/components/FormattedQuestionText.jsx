import React from 'react'

/**
 * Strip leaked option blocks that LLMs occasionally append to the question stem.
 * E.g. "(A) 1 only (B) 2 only (C) Both (D) Neither" or "Codes:\n A. 1-C, 2-A..."
 * or trailing Odd-One-Out options embedded after prompt.
 */
export function stripLeakedOptions(text = '') {
  if (!text || typeof text !== 'string') return ''
  let cleaned = text.trim()

  // 0. Remove clock / timer emojis if present
  cleaned = cleaned.replace(/[\u{1F550}-\u{1F567}\u{23F0}-\u{23F3}\u{231A}\u{231B}\u{2328}\u{23CF}]/gu, '').trim()

  // 1. Detect and strip trailing A, B, C, D (or Telugu ఎ, బి, సి, డి) options sequence
  // Prevents Odd-One-Out or leaked options from cluttering the question stem
  const optSeqRegex = /(?:([:\?\.\!])\s*|(?:\r?\n)+\s*|\s{2,}|\s+(?=\(?[A-Da-d]\b[\.\:\)\-]))\s*\(?(?:A|[ఎఏ])[\.\:\)\-\]]\s+((?:(?!List-|Column-|జాబితా|Select\b)[\s\S])+?)\s*\(?(?:B|బి)[\.\:\)\-\]]\s+((?:(?!List-|Column-|జాబితా|Select\b)[\s\S])+?)\s*\(?(?:C|సి)[\.\:\)\-\]]\s+((?:(?!List-|Column-|జాబితా|Select\b)[\s\S])+?)\s*\(?(?:D|డి)[\.\:\)\-\]]\s+((?:(?!List-|Column-|జాబితా|Select\b)[\s\S])+)$/i

  const seqMatch = cleaned.match(optSeqRegex)
  if (seqMatch) {
    const delim = seqMatch[1] || ''
    cleaned = cleaned.slice(0, seqMatch.index).trim()
    if (delim && !cleaned.endsWith(delim)) {
      cleaned += delim
    }
  }

  // 2. Explicit codes / options header block at the end
  cleaned = cleaned.replace(
    /(?:[\n\.\?!:]\s*|\s{2,})\b(?:Codes?|Options?|ఎంపికలు|కోడ్లు|కోడ్స్|సరైన\s*కోడ్|సరైన\s*సమాధానం)\s*[:\s]*[\n\s]*\(?[A-Da-d1-4]\)?[\s\S]*$/i,
    ''
  )

  // 3. Trailing options following a question mark '?'
  cleaned = cleaned.replace(
    /\?\s*[\n\s]+\(?[A-Da-d]\)?[\s\.:\-\)]*\s+[^\n]+(?:\s*\n\s*\(?[B-Db-d]\)?[\s\.:\-\)]*\s+[^\n]+){2,}[\s\S]*$/i,
    '?'
  )

  // 4. Trailing options following a concluding prompt sentence (e.g. 'Select the correct code...:')
  cleaned = cleaned.replace(
    /((?:Select|Choose|Use|క్రింది|కింది|పై)[^\n?:]*(?:code|option|answer|కోడ్|ఎంపిక|సమాధానం)[^:\n?]*[:\?]?)\s*[\n\s]+\(?[A-Da-d]\)?[\s\.:\-\)]*\s+[^\n]+(?:\s*\n\s*\(?[B-Db-d]\)?[\s\.:\-\)]*\s+[^\n]+){2,}[\s\S]*$/i,
    '$1'
  )

  return cleaned.trim()
}

/**
 * Render inline markdown formatting (e.g. **bold**, *italic*) cleanly so literal asterisks are never visible.
 */
export function renderInlineFormatted(text) {
  if (!text || typeof text !== 'string') return null
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  if (parts.length === 1) return text

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} style={{ fontWeight: 650, color: 'var(--text-1)' }}>
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

/**
 * Parses individual list items (A, B, C, D or 1, 2, 3, 4 or i, ii, iii, iv) from a text block.
 */
function parseListItems(listText, isAlpha = true) {
  if (!listText) return []
  // Strip markdown bold wrappers like **A.** -> A.
  const text = listText.replace(/\*\*([A-Da-d1-9]|10|[ivxIVX]{1,4})\.?\*\*/g, '$1.').trim()

  const markerRegex = isAlpha
    ? /(?:^|\s+)\(?([A-Da-d])\)?[.:\)]\s*/g
    : /(?:^|\s+)\(?([1-9]|10|[ivxIVX]{1,4})\)?[.:\)]\s*/g

  const matches = [...text.matchAll(markerRegex)]
  if (matches.length < 2) return []

  const items = []
  for (let i = 0; i < matches.length; i++) {
    const label = matches[i][1].toUpperCase()
    const startPos = matches[i].index + matches[i][0].length
    const endPos = i < matches.length - 1 ? matches[i + 1].index : text.length
    const content = text.slice(startPos, endPos).trim().replace(/^[:\-\.]\s*/, '').replace(/\s*[*_]+$/, '')
    if (content) {
      items.push({ label, text: content })
    }
  }
  return items
}

/**
 * Concluding prompt regex covering standard APPSC, TGPSC, and UPSC inquiry sentences in English and Telugu.
 */
const CONCLUDING_PROMPT_REGEX = /(?:^|[\n\.\?!]|\s+)((?:Which\s+of\s+the|Select\s+the|Choose\s+the|What\s+is|In\s+the\s+context|కింది\s*ఎంపికలలో|క్రింది\s*వాటిలో|పై\s*వాటిలో|సరైన\s*జతలు|సరైన\s*కోడ్|సరైన\s*సమాధానం|సరైన\s*ఎంపిక|కోడ్|పై\s*ప్రకటనలలో|సరైనది\s*ఏది|సరికానిది\s*ఏది)[^?:]*[\?:]\s*)$/i

/**
 * FormattedQuestionText
 * ─────────────────────────────────────────────────────────────
 * Investor-grade parser and formatter for diverse APPSC/UPSC question formats:
 * 1. Match the Following (2-column comparison table, handles dual lists, tables, and pairwise hyphens)
 * 2. Assertion-Reason (A & R distinct high-contrast cards)
 * 3. Chronology based questions (ordered timeline sequence with time badges)
 * 4. Statement-based questions (1, 2, 3... numbered cards)
 * 5. Direct / Concept questions (with markdown parsing and preserved whitespace)
 */
export function parseQuestionText(text = '') {
  if (!text || typeof text !== 'string') return { format: 'direct', intro: '', prompt: text || '' }

  // Clean leaked options first
  const cleanedRaw = stripLeakedOptions(text)
  const isTelugu = /[\u0C00-\u0C7F]/.test(cleanedRaw)

  // ── 1. Match the Following Extraction ───────────────────────────────────────
  let prompt = isTelugu ? 'సరైన కోడ్‌ను ఎంచుకోండి:' : 'Select the correct code:'
  let bodyText = cleanedRaw

  const pMatch = cleanedRaw.match(CONCLUDING_PROMPT_REGEX)
  if (pMatch) {
    prompt = pMatch[1].trim()
    bodyText = cleanedRaw.slice(0, pMatch.index).trim()
  }

  // 1a. Standard Two-Block Match Pattern (List-I / Column A / జాబితా-I / గ్రూప్ A)
  const list1Regex = /(?:List|Column|జాబితా|స్తంభం|కాలమ్|గ్రూప్|Group|విభాగం)\s*[-–:\.]?\s*(?:I|1|A)\b\s*(\([^)]*\))?[:\s]*/gi
  const list2Regex = /(?:List|Column|జాబితా|స్తంభం|కాలమ్|గ్రూప్|Group|విభాగం)\s*[-–:\.]?\s*(?:II|2|B)\b\s*(\([^)]*\))?[:\s]*/gi

  const matches1 = [...bodyText.matchAll(list1Regex)]
  const matches2 = [...bodyText.matchAll(list2Regex)]

  if (matches1.length > 0 && matches2.length > 0) {
    for (let i = matches1.length - 1; i >= 0; i--) {
      const m1 = matches1[i]
      for (const m2 of matches2) {
        if (m1.index >= m2.index) continue

        const list1Raw = bodyText.slice(m1.index + m1[0].length, m2.index).trim()
        const list2Raw = bodyText.slice(m2.index + m2[0].length).trim()

        let list1 = parseListItems(list1Raw, false)
        let list2 = parseListItems(list2Raw, true)

        if (list1.length < 2 || list2.length < 2) {
          list1 = parseListItems(list1Raw, true)
          list2 = parseListItems(list2Raw, false)
        }

        if (list1.length >= 2 && list2.length >= 2) {
          let intro = bodyText.slice(0, m1.index).trim()
          if (!intro || intro.toLowerCase() === 'match' || intro.length < 5) {
            intro = isTelugu ? 'కింది జాబితా-I ను జాబితా-II తో సరిపోల్చండి:' : 'Match List-I with List-II:'
          }

          const list1Header = m1[1] ? `List-I ${m1[1]}` : (m1[0].trim().replace(/[:\s]+$/, '') || (isTelugu ? 'జాబితా-I' : 'List-I'))
          const list2Header = m2[1] ? `List-II ${m2[1]}` : (m2[0].trim().replace(/[:\s]+$/, '') || (isTelugu ? 'జాబితా-II' : 'List-II'))

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

  // 1b. Pairwise Hyphenated / Tabular Match Pattern
  // E.g. "Match the following: \n 1. Article 14 - Right to Equality \n 2. Article 17 - Abolition of Untouchability..."
  const isMatchIntent = /(?:Match|సరిపోల్చండి|జతలను|జతపరచండి|స్తంభం|జాబితా|Column|Pair)/i.test(bodyText)
  if (isMatchIntent) {
    const pairRegex = /(?:^|\n)\s*(?:\(?([1-9]|10|[A-Da-d])\)?[\.:\)]\s*)?([^\n\-\–—:]+?)\s*[-–—:|]\s*([^\n]+)/g
    const pairMatches = [...bodyText.matchAll(pairRegex)]

    if (pairMatches.length >= 3) {
      const list1 = []
      const list2 = []
      const romanLetters = ['A', 'B', 'C', 'D', 'E', 'F']

      for (let idx = 0; idx < pairMatches.length; idx++) {
        const pm = pairMatches[idx]
        const numLabel = pm[1] ? pm[1].trim() : `${idx + 1}`
        const leftText = pm[2].trim()
        const rightText = pm[3].trim()

        if (leftText && rightText) {
          list1.push({ label: numLabel, text: leftText })
          list2.push({ label: romanLetters[idx] || `${idx + 1}`, text: rightText })
        }
      }

      if (list1.length >= 3) {
        const firstPairPos = pairMatches[0].index
        let intro = bodyText.slice(0, firstPairPos).trim()
        if (!intro || intro.length < 5) {
          intro = isTelugu ? 'కింది జతలను సరిపోల్చండి:' : 'Match the following:'
        }

        return {
          format: 'match_the_following',
          intro,
          list1Title: isTelugu ? 'జాబితా-I' : 'List-I',
          list2Title: isTelugu ? 'జాబితా-II' : 'List-II',
          list1,
          list2,
          prompt,
        }
      }
    }
  }

  // ── 2. Assertion-Reason Pattern (English & Telugu) ───────────────────────────
  const cleanBody = bodyText.replace(/\*\*/g, '')
  const arRegex = /(?:Assertion\s*(?:\([A|a]\)|:|-)|ప్రతిపాదన\s*(?:\([A|a]\)|:|-)|ప్రకటన\s*(?:\([A|a]\)|:|-)|వాదన\s*(?:\([A|a]\)|:|-))[:\s-]+([\s\S]+?)(?:Reason\s*(?:\([R|r]\)|:|-)|హేతువు\s*(?:\([R|r]\)|:|-)|కారణం\s*(?:\([R|r]\)|:|-)|కారణము\s*(?:\([R|r]\)|:|-)|వివరణ\s*(?:\([R|r]\)|:|-))[:\s-]+([\s\S]+)$/i
  const arMatch = cleanBody.match(arRegex)

  if (arMatch) {
    const assertionText = arMatch[1].trim()
    let reasonText = arMatch[2].trim()
    let arPrompt = ''

    const pMatchAR = reasonText.match(CONCLUDING_PROMPT_REGEX)
    if (pMatchAR) {
      arPrompt = pMatchAR[1].trim()
      reasonText = reasonText.slice(0, pMatchAR.index).trim()
    }

    reasonText = stripLeakedOptions(reasonText).replace(/[:\-–]\s*$/, '').trim()

    let intro = cleanBody.slice(0, arMatch.index).trim()
    if (!intro || intro.length < 3) {
      intro = isTelugu ? 'క్రింది ప్రకటనలను చదవండి:' : 'Read the following statements:'
    }

    return {
      format: 'assertion_reason',
      intro,
      assertion: assertionText,
      reason: reasonText,
      prompt: arPrompt || (isTelugu ? 'సరైన ఎంపికను ఎంచుకోండి:' : 'Select the correct option:'),
    }
  }

  // ── 3. Chronology / Timeline Pattern ────────────────────────────────────────
  const isChronology = /\b(chronological|chronology|కాలక్రమ|కాలక్రమం|sequence of events|order of occurrence)\b/i.test(cleanedRaw)

  // ── 4. Statement-based Pattern (1., 2., 3... or (i), (ii)... or Statement 1:) ───
  // Statement markers: 1. / (1) / 1) / Statement 1: / ప్రకటన 1: / (i) / I.
  const statementRegex = /(?:^|[\n;\.]\s*|\s+)(?:Statement\s+|ప్రకటన\s+)?\(?([1-9]|10|[iI]{1,3}|[vV]|[xX]|IV|VI)\)?[\.:\)]\s+/gi
  const matches = [...bodyText.matchAll(statementRegex)]

  if (matches.length >= 2) {
    const firstIndex = matches[0].index
    const intro = bodyText.slice(0, firstIndex).trim()

    const statements = []
    for (let i = 0; i < matches.length; i++) {
      const num = matches[i][1]
      const startPos = matches[i].index + matches[i][0].length
      const endPos = (i < matches.length - 1) ? matches[i + 1].index : bodyText.length
      let itemContent = bodyText.slice(startPos, endPos).trim()
      // Strip redundant leading numbers or bolding
      itemContent = itemContent.replace(/^(?:\(?\d+\)?[\.:\)]\s*)+/, '').trim()

      if (itemContent) {
        statements.push({ num: `${i + 1}`, content: itemContent })
      }
    }

    if (statements.length >= 2) {
      return {
        format: isChronology ? 'chronology' : 'statement',
        intro: intro || (isChronology
          ? (isTelugu ? 'కింది సంఘటనలను కాలక్రమానుసారంగా అమర్చండి:' : 'Arrange the following in chronological order:')
          : (isTelugu ? 'క్రింది ప్రకటనలను పరిశీలించండి:' : 'Consider the following statements:')),
        statements,
        prompt: prompt,
      }
    }
  }

  // ── 5. Bullet Point List Fallback to Statement ──────────────────────────────
  if (bodyText.includes('\n- ') || bodyText.includes('\n• ') || bodyText.includes('\n* ')) {
    const bulletLines = bodyText.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const bulletItems = []
    let introLine = ''

    for (const line of bulletLines) {
      if (/^[•\-\*]\s+/.test(line)) {
        bulletItems.push(line.replace(/^[•\-\*]\s+/, '').trim())
      } else if (bulletItems.length === 0) {
        introLine += (introLine ? ' ' : '') + line
      }
    }

    if (bulletItems.length >= 2) {
      return {
        format: isChronology ? 'chronology' : 'statement',
        intro: introLine || (isTelugu ? 'క్రింది అంశాలను పరిశీలించండి:' : 'Consider the following items:'),
        statements: bulletItems.map((item, idx) => ({ num: `${idx + 1}`, content: item })),
        prompt: prompt,
      }
    }
  }

  // ── 6. Default Direct Question ──────────────────────────────────────────────
  return {
    format: 'direct',
    intro: '',
    statements: [],
    prompt: cleanedRaw,
  }
}

export default function FormattedQuestionText({ text, className = '' }) {
  const parsed = parseQuestionText(text)

  // ── Match the Following: Responsive 2-Column Table UI ────
  if (parsed.format === 'match_the_following') {
    const maxRows = Math.max(parsed.list1.length, parsed.list2.length)
    const rows = Array.from({ length: maxRows }).map((_, i) => ({
      item1: parsed.list1[i] || null,
      item2: parsed.list2[i] || null,
    }))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }} className={className}>
        {parsed.intro && (
          <p style={{ fontSize: 'clamp(13px, 2.8vw, 14px)', fontWeight: 600, lineHeight: 1.5, color: 'var(--text-1)', margin: 0, wordBreak: 'break-word' }}>
            {renderInlineFormatted(parsed.intro)}
          </p>
        )}

        {/* 2-Column Responsive Structured Table */}
        <div style={{ borderRadius: 9, overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid var(--border)', background: 'var(--surface-elevated)', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 260 }}>
            <thead>
              <tr style={{ background: 'rgba(79, 142, 247, 0.08)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '8px 12px', width: '50%', fontSize: 'clamp(10px, 2.2vw, 11.5px)', fontWeight: 700, color: 'var(--indigo)', borderRight: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.04em', wordBreak: 'break-word', lineHeight: 1.35 }}>
                  {parsed.list1Title || 'List-I'}
                </th>
                <th style={{ padding: '8px 12px', width: '50%', fontSize: 'clamp(10px, 2.2vw, 11.5px)', fontWeight: 700, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: '0.04em', wordBreak: 'break-word', lineHeight: 1.35 }}>
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
                  <td style={{ padding: '8px 12px', verticalAlign: 'top', borderRight: '1px solid var(--border)', fontSize: 'clamp(12px, 2.5vw, 13px)', color: 'var(--text-1)', wordBreak: 'break-word' }}>
                    {row.item1 && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                        <span style={{
                          flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                          background: 'var(--indigo-dim)', color: 'var(--indigo)',
                          border: '1px solid var(--indigo-border)', fontSize: 11,
                          fontWeight: 700, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', marginTop: 1,
                        }}>
                          {row.item1.label}
                        </span>
                        <span style={{ lineHeight: 1.5, flex: 1, fontWeight: 500, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {renderInlineFormatted(row.item1.text)}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Right Column (List II) */}
                  <td style={{ padding: '8px 12px', verticalAlign: 'top', fontSize: 'clamp(12px, 2.5vw, 13px)', color: 'var(--text-1)', wordBreak: 'break-word' }}>
                    {row.item2 && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                        <span style={{
                          flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                          background: 'var(--emerald-dim)', color: 'var(--emerald)',
                          border: '1px solid var(--emerald-border)', fontSize: 11,
                          fontWeight: 700, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', marginTop: 1,
                        }}>
                          {row.item2.label}
                        </span>
                        <span style={{ lineHeight: 1.5, flex: 1, fontWeight: 500, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {renderInlineFormatted(row.item2.text)}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {parsed.prompt && (
          <p style={{ fontSize: 'clamp(12.5px, 2.5vw, 13.5px)', fontWeight: 650, color: 'var(--text-1)', margin: '4px 0 0', wordBreak: 'break-word' }}>
            {renderInlineFormatted(parsed.prompt)}
          </p>
        )}
      </div>
    )
  }

  // ── Assertion & Reason UI ────────────────────────────────
  if (parsed.format === 'assertion_reason') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, width: '100%' }} className={className}>
        {parsed.intro && (
          <p style={{ fontSize: 'clamp(13px, 2.8vw, 13.5px)', fontWeight: 600, color: 'var(--text-1)', margin: 0, wordBreak: 'break-word' }}>
            {renderInlineFormatted(parsed.intro)}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Assertion (A) Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                fontSize: 10.5,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 5,
                background: 'var(--indigo-dim)',
                color: 'var(--indigo)',
                border: '1px solid var(--indigo-border)',
                marginTop: 1,
                letterSpacing: '0.02em',
              }}
            >
              Assertion (A)
            </span>
            <p style={{ fontSize: 'clamp(12.5px, 2.5vw, 13.5px)', lineHeight: 1.5, color: 'var(--text-1)', margin: 0, flex: 1, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              {renderInlineFormatted(parsed.assertion)}
            </p>
          </div>

          {/* Reason (R) Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                fontSize: 10.5,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 5,
                background: 'rgba(6,182,212,0.12)',
                color: '#06B6D4',
                border: '1px solid rgba(6,182,212,0.3)',
                marginTop: 1,
                letterSpacing: '0.02em',
              }}
            >
              Reason (R)
            </span>
            <p style={{ fontSize: 'clamp(12.5px, 2.5vw, 13.5px)', lineHeight: 1.5, color: 'var(--text-1)', margin: 0, flex: 1, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              {renderInlineFormatted(parsed.reason)}
            </p>
          </div>
        </div>

        {parsed.prompt && (
          <p style={{ fontSize: 'clamp(12.5px, 2.5vw, 13.5px)', fontWeight: 650, color: 'var(--text-1)', margin: '3px 0 0', wordBreak: 'break-word' }}>
            {renderInlineFormatted(parsed.prompt)}
          </p>
        )}
      </div>
    )
  }

  // ── Chronology / Timeline UI ─────────────────────────────
  if (parsed.format === 'chronology') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, width: '100%' }} className={className}>
        {parsed.intro && (
          <p style={{ fontSize: 'clamp(13px, 2.8vw, 13.5px)', fontWeight: 600, color: 'var(--text-1)', margin: 0, wordBreak: 'break-word' }}>
            {renderInlineFormatted(parsed.intro)}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {parsed.statements.map((st, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 9,
                padding: '9px 12px',
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
                  background: 'var(--gold-dim)',
                  color: 'var(--gold-hi)',
                  border: '1px solid var(--gold-border)',
                  marginTop: 1,
                }}
              >
                {st.num}
              </span>
              <p style={{ fontSize: 'clamp(12.5px, 2.5vw, 13.5px)', lineHeight: 1.5, color: 'var(--text-1)', margin: 0, flex: 1, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {renderInlineFormatted(st.content)}
              </p>
            </div>
          ))}
        </div>

        {parsed.prompt && (
          <p style={{ fontSize: 'clamp(12.5px, 2.5vw, 13.5px)', fontWeight: 650, color: 'var(--text-1)', margin: '3px 0 0', wordBreak: 'break-word' }}>
            {renderInlineFormatted(parsed.prompt)}
          </p>
        )}
      </div>
    )
  }

  // ── Statement Cards UI ───────────────────────────────────
  if (parsed.statements?.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, width: '100%' }} className={className}>
        {parsed.intro && (
          <p style={{ fontSize: 'clamp(13px, 2.8vw, 13.5px)', fontWeight: 600, lineHeight: 1.5, color: 'var(--text-1)', margin: 0, wordBreak: 'break-word' }}>
            {renderInlineFormatted(parsed.intro)}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {parsed.statements.map((st, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 9,
                padding: '9px 12px',
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
                  marginTop: 1,
                }}
              >
                {st.num}
              </span>
              <p style={{ fontSize: 'clamp(12.5px, 2.5vw, 13.5px)', lineHeight: 1.5, color: 'var(--text-1)', margin: 0, flex: 1, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {renderInlineFormatted(st.content)}
              </p>
            </div>
          ))}
        </div>

        {parsed.prompt && (
          <p style={{ fontSize: 'clamp(12.5px, 2.5vw, 13.5px)', fontWeight: 650, color: 'var(--text-1)', margin: '3px 0 0', wordBreak: 'break-word' }}>
            {renderInlineFormatted(parsed.prompt)}
          </p>
        )}
      </div>
    )
  }

  // ── Default / Direct Question UI (Preserves formatting & paragraph breaks) ────
  const cleanedPrompt = stripLeakedOptions(text)
  const paragraphs = cleanedPrompt.split(/\n{2,}/).filter(Boolean)

  if (paragraphs.length > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }} className={className}>
        {paragraphs.map((para, idx) => (
          <p
            key={idx}
            style={{
              fontSize: 'clamp(13px, 2.8vw, 14px)',
              fontWeight: idx === paragraphs.length - 1 ? 600 : 500,
              lineHeight: 1.55,
              color: 'var(--text-1)',
              margin: 0,
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {renderInlineFormatted(para)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <p
      className={className}
      style={{
        fontSize: 'clamp(13px, 2.8vw, 14px)',
        fontWeight: 500,
        lineHeight: 1.55,
        color: 'var(--text-1)',
        margin: 0,
        whiteSpace: 'pre-line',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      }}
    >
      {renderInlineFormatted(cleanedPrompt)}
    </p>
  )
}
