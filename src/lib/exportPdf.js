/**
 * exportPdf.js
 * ─────────────────────────────────────────────────────────────
 * Generates publication-quality, multi-page branded PDFs for study notes.
 * Includes running headers & footers across ALL pages, styled headings,
 * indented bullet lists, bold emphasis, and consistent typography.
 */
import { jsPDF } from 'jspdf'

/**
 * Renders running header bar on pages 2+.
 */
function drawPageHeader(doc, topic, exam, pageW, margin) {
  doc.setFillColor(14, 22, 40) // Royal Navy
  doc.rect(0, 0, pageW, 14, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('APPSC AI', margin, 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(180, 205, 255)
  doc.text('Ace with Ease IAS', margin + 22, 9)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(247, 181, 0) // Ace Gold
  doc.text(topic ? topic.slice(0, 45) : (exam || 'Study Notes'), pageW - margin, 9, { align: 'right' })

  doc.setDrawColor(32, 47, 78)
  doc.setLineWidth(0.3)
  doc.line(0, 14, pageW, 14)
}

/**
 * Renders running footer on all pages.
 */
function drawPageFooter(doc, pageW, pageH, margin, pageNum, totalPages) {
  doc.setDrawColor(220, 225, 235)
  doc.setLineWidth(0.3)
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(130, 140, 160)
  doc.text('APPSC AI — Ace with Ease IAS Preparation Platform', margin, pageH - 6)
  if (totalPages) {
    doc.text(`Page ${pageNum} of ${totalPages}`, pageW - margin, pageH - 6, { align: 'right' })
  } else {
    doc.text(`Page ${pageNum}`, pageW - margin, pageH - 6, { align: 'right' })
  }
}

/**
 * Main export function for Study Notes.
 */
export function exportNotesToPdf({ topic, exam, content = '', date }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 16
  const contentW = pageW - margin * 2
  const footerReserved = 16
  let y = margin

  // ── Page 1: Hero Header Banner ──────────────────────────────────────────────
  doc.setFillColor(14, 22, 40) // Royal Navy
  doc.rect(0, 0, pageW, 26, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text('APPSC AI', margin, 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(180, 205, 255)
  doc.text('Ace with Ease IAS — AI Exam Preparation Platform', margin, 18)

  // Exam badge on top right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(247, 181, 0) // Ace Gold
  doc.text(exam || 'APPSC Exam Notes', pageW - margin, 11, { align: 'right' })

  y = 35

  // ── Topic Title ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(15, 23, 42)
  const titleLines = doc.splitTextToSize(topic || 'Study Notes', contentW)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 6.5 + 2

  // ── Date sub-line ────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generated: ${date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, margin, y)
  y += 6

  // ── Divider ──────────────────────────────────────────────────────────────────
  doc.setDrawColor(21, 121, 230) // Royal Blue accent
  doc.setLineWidth(0.6)
  doc.line(margin, y, pageW - margin, y)
  y += 7

  // ── Parse & Render Content Blocks ──────────────────────────────────────────
  const rawLines = content.split(/\r?\n/)

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageH - footerReserved) {
      doc.addPage()
      drawPageHeader(doc, topic, exam, pageW, margin)
      y = 22 // start below header bar
      return true
    }
    return false
  }

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim()

    // Blank lines → small gap
    if (!line) {
      y += 2.5
      continue
    }

    // ── H1 Heading (# Heading) ────────────────────────────────────────────────
    if (line.startsWith('# ')) {
      const hText = line.replace(/^#\s+/, '').replace(/\*\*/g, '').trim()
      checkPageBreak(12)
      y += 3
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(21, 121, 230) // Royal Blue
      const wrapped = doc.splitTextToSize(hText, contentW)
      doc.text(wrapped, margin, y)
      y += wrapped.length * 5.5 + 2
      continue
    }

    // ── H2 Heading (## Heading) ───────────────────────────────────────────────
    if (line.startsWith('## ')) {
      const hText = line.replace(/^##\s+/, '').replace(/\*\*/g, '').trim()
      checkPageBreak(10)
      y += 2.5
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11.5)
      doc.setTextColor(15, 23, 42)
      const wrapped = doc.splitTextToSize(hText, contentW)
      doc.text(wrapped, margin, y)
      y += wrapped.length * 5 + 1.5

      // Underline for H2
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.3)
      doc.line(margin, y, pageW - margin, y)
      y += 3
      continue
    }

    // ── H3 Heading (### Heading) ──────────────────────────────────────────────
    if (line.startsWith('### ')) {
      const hText = line.replace(/^###\s+/, '').replace(/\*\*/g, '').trim()
      checkPageBreak(8)
      y += 2
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(30, 41, 59)
      const wrapped = doc.splitTextToSize(hText, contentW)
      doc.text(wrapped, margin, y)
      y += wrapped.length * 4.8 + 1.5
      continue
    }

    // ── Bullet Point (- item, * item, • item, 1. item) ────────────────────────
    const isBullet = /^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)
    if (isBullet) {
      const bulletPrefix = /^[-*•]\s+/.test(line) ? '•' : line.match(/^\d+\./)[0]
      const bodyText = line.replace(/^([-*•]|\d+\.)\s+/, '').trim()
      const cleanBody = bodyText.replace(/\*\*(.*?)\*\*/g, '$1') // plain text for wrapping measurement

      const indent = 6
      const itemW = contentW - indent

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      const wrapped = doc.splitTextToSize(cleanBody, itemW)

      checkPageBreak(wrapped.length * 4.6 + 2)

      // Draw bullet / number
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(21, 121, 230) // Royal Blue bullet
      doc.text(bulletPrefix, margin + 1, y)

      // Draw item text (support bold prefix if **bold**: rest)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 41, 59)

      // If line starts with bold key like **Key Concept**:
      const boldKeyMatch = bodyText.match(/^\*\*(.*?)\*\*\s*(.*)/)
      if (boldKeyMatch) {
        const key = boldKeyMatch[1]
        const rest = boldKeyMatch[2]

        // Measure key width
        doc.setFont('helvetica', 'bold')
        doc.text(key, margin + indent, y)
        const keyWidth = doc.getTextWidth(key + ' ')

        doc.setFont('helvetica', 'normal')
        if (rest) {
          const restWrapped = doc.splitTextToSize(rest, itemW - keyWidth)
          if (restWrapped.length > 0) {
            doc.text(restWrapped[0], margin + indent + keyWidth, y)
            for (let r = 1; r < restWrapped.length; r++) {
              y += 4.6
              doc.text(restWrapped[r], margin + indent, y)
            }
          }
        }
      } else {
        doc.text(wrapped, margin + indent, y)
      }

      y += (wrapped.length > 1 && boldKeyMatch ? (wrapped.length - 1) * 4.6 : 0) + 4.8
      continue
    }

    // ── Blockquote (> quote) ─────────────────────────────────────────────────
    if (line.startsWith('>')) {
      const qText = line.replace(/^>\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1').trim()
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      const wrapped = doc.splitTextToSize(qText, contentW - 8)

      checkPageBreak(wrapped.length * 4.5 + 4)

      // Quote bar
      doc.setFillColor(247, 181, 0) // Ace Gold bar
      doc.rect(margin, y - 2, 2, wrapped.length * 4.5 + 2, 'F')

      doc.setTextColor(71, 85, 105)
      doc.text(wrapped, margin + 5, y)
      y += wrapped.length * 4.5 + 3.5
      continue
    }

    // ── Normal Paragraph Line ────────────────────────────────────────────────
    const cleanLine = line.replace(/\*\*(.*?)\*\*/g, '$1')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(30, 41, 59)
    const wrapped = doc.splitTextToSize(cleanLine, contentW)

    checkPageBreak(wrapped.length * 4.6 + 2)

    // Check for bold lead-in like **Important Note**: text
    const boldLeadMatch = line.match(/^\*\*(.*?)\*\*\s*(.*)/)
    if (boldLeadMatch) {
      const leadKey = boldLeadMatch[1]
      const leadRest = boldLeadMatch[2]

      doc.setFont('helvetica', 'bold')
      doc.text(leadKey, margin, y)
      const leadWidth = doc.getTextWidth(leadKey + ' ')

      doc.setFont('helvetica', 'normal')
      if (leadRest) {
        const restWrapped = doc.splitTextToSize(leadRest, contentW - leadWidth)
        if (restWrapped.length > 0) {
          doc.text(restWrapped[0], margin + leadWidth, y)
          for (let r = 1; r < restWrapped.length; r++) {
            y += 4.6
            doc.text(restWrapped[r], margin, y)
          }
        }
      }
      y += 4.8
    } else {
      doc.text(wrapped, margin, y)
      y += wrapped.length * 4.6 + 1.5
    }
  }

  // ── Render Footers on All Pages ────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    drawPageFooter(doc, pageW, pageH, margin, p, totalPages)
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  const filename = `APPSC_AI_${(topic || 'Notes').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}.pdf`
  doc.save(filename)
}
