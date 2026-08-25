/**
 * exportPdf.js
 * ─────────────────────────────────────────────────────────────
 * Generates publication-quality, multi-page branded PDFs for study notes,
 * MCQ practice tests, and study plans.
 * Supports Telugu (Unicode Indic script) and English with zero gibberish
 * using high-DPI browser rendering and multi-page A4 canvas slicing.
 */
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Detect whether string contains Telugu characters (\u0C00 - \u0C7F)
 */
export const containsTelugu = (str) => /[\u0C00-\u0C7F]/.test(str || '')

/**
 * Convert Markdown text to clean, styled HTML for PDF printing.
 */
function markdownToHtml(md = '') {
  if (!md) return ''
  const lines = md.split(/\r?\n/)
  let html = ''
  let inList = false
  let inTable = false
  let tableRows = []

  const closeList = () => {
    if (inList) {
      html += '</ul>'
      inList = false
    }
  }

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      html += '<table style="width:100%; border-collapse:collapse; margin:14px 0; font-size:12px;">'
      tableRows.forEach((row, rIdx) => {
        const isHeader = rIdx === 0
        html += '<tr>'
        row.forEach((cell) => {
          const formattedCell = formatInlineMarkdown(cell)
          if (isHeader) {
            html += `<th style="background:#2563eb; color:#ffffff; padding:8px 10px; border:1px solid #cbd5e1; text-align:left; font-weight:600;">${formattedCell}</th>`
          } else {
            html += `<td style="background:${rIdx % 2 === 0 ? '#f8fafc' : '#ffffff'}; padding:7px 10px; border:1px solid #e2e8f0; color:#1e293b;">${formattedCell}</td>`
          }
        })
        html += '</tr>'
      })
      html += '</table>'
      inTable = false
      tableRows = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    if (!trimmed) {
      closeList()
      flushTable()
      continue
    }

    // Markdown Table Row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeList()
      const cells = trimmed.split('|').map((c) => c.trim()).slice(1, -1)
      if (cells.length > 0 && cells[0].includes('---')) {
        continue // skip separator row
      }
      inTable = true
      tableRows.push(cells)
      continue
    } else {
      flushTable()
    }

    // H1 Heading (# Heading)
    if (trimmed.startsWith('# ')) {
      closeList()
      const text = formatInlineMarkdown(trimmed.replace(/^#\s+/, ''))
      html += `<h1 style="font-size:20px; font-weight:700; color:#1d4ed8; margin:18px 0 8px; border-bottom:2px solid #93c5fd; padding-bottom:4px;">${text}</h1>`
      continue
    }

    // H2 Heading (## Heading)
    if (trimmed.startsWith('## ')) {
      closeList()
      const text = formatInlineMarkdown(trimmed.replace(/^##\s+/, ''))
      html += `<h2 style="font-size:16px; font-weight:700; color:#0f172a; margin:16px 0 6px; border-bottom:1px solid #e2e8f0; padding-bottom:3px;">${text}</h2>`
      continue
    }

    // H3 Heading (### Heading)
    if (trimmed.startsWith('### ')) {
      closeList()
      const text = formatInlineMarkdown(trimmed.replace(/^###\s+/, ''))
      html += `<h3 style="font-size:14px; font-weight:600; color:#1e293b; margin:12px 0 4px;">${text}</h3>`
      continue
    }

    // Bullet Points
    if (/^[-*•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      if (!inList) {
        html += '<ul style="margin:6px 0 10px; padding-left:22px; list-style-type:disc;">'
        inList = true
      }
      const itemText = formatInlineMarkdown(trimmed.replace(/^([-*•]|\d+\.)\s+/, ''))
      html += `<li style="font-size:13px; line-height:1.6; color:#334155; margin-bottom:4px;">${itemText}</li>`
      continue
    } else {
      closeList()
    }

    // Blockquote (> Quote)
    if (trimmed.startsWith('>')) {
      const qText = formatInlineMarkdown(trimmed.replace(/^>\s*/, ''))
      html += `<blockquote style="border-left:4px solid #f59e0b; background:#fef3c7; padding:8px 14px; margin:10px 0; border-radius:4px; font-size:12.5px; font-style:italic; color:#78350f;">${qText}</blockquote>`
      continue
    }

    // Paragraph
    const paraText = formatInlineMarkdown(trimmed)
    html += `<p style="font-size:13px; line-height:1.65; color:#1e293b; margin:6px 0 10px;">${paraText}</p>`
  }

  closeList()
  flushTable()
  return html
}

function formatInlineMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:#f1f5f9; padding:2px 4px; border-radius:4px; font-family:monospace; font-size:12px;">$1</code>')
    .replace(/\*\*/g, '') // strip any unmatched double asterisks
}

/**
 * Render an HTML element into a multi-page A4 PDF.
 */
async function renderHtmlToPdf(htmlContent, filename) {
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.width = '800px'
  container.style.background = '#ffffff'
  container.style.color = '#0f172a'
  container.style.fontFamily = "'Noto Sans Telugu', 'Gautami', 'Mandali', 'TenaliRamakrishna', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  container.style.padding = '32px 36px'
  container.style.boxSizing = 'border-box'
  container.innerHTML = htmlContent

  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const pdfPageWidth = 210
    const pdfPageHeight = 297
    const margin = 10
    const contentWidth = pdfPageWidth - margin * 2

    const pageCanvasHeight = (canvas.width * (pdfPageHeight - margin * 2)) / contentWidth
    let renderedHeight = 0
    let pageIndex = 0

    while (renderedHeight < canvas.height) {
      if (pageIndex > 0) {
        doc.addPage()
      }

      const sourceHeight = Math.min(canvas.height - renderedHeight, pageCanvasHeight)
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = pageCanvasHeight
      const ctx = pageCanvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
      ctx.drawImage(
        canvas,
        0, renderedHeight, canvas.width, sourceHeight,
        0, 0, canvas.width, sourceHeight
      )

      const imgData = pageCanvas.toDataURL('image/jpeg', 0.95)
      doc.addImage(imgData, 'JPEG', margin, margin, contentWidth, pdfPageHeight - margin * 2)

      // Add footer
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(140, 150, 165)
      doc.text('APPSC AI Exam Preparation Platform', margin, pdfPageHeight - 4)

      renderedHeight += pageCanvasHeight
      pageIndex++
    }

    // Add page numbers on each page
    const totalPages = doc.internal.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(140, 150, 165)
      doc.text(`Page ${p} of ${totalPages}`, pdfPageWidth - margin, pdfPageHeight - 4, { align: 'right' })
    }

    doc.save(filename)
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container)
    }
  }
}

/**
 * Main export function for Study Notes (Telugu & English).
 */
export async function exportNotesToPdf({ topic, exam, content = '', date }) {
  const displayTopic = topic || 'Study Notes'
  const displayExam = exam || 'APPSC'
  const displayDate = date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const cleanBodyHtml = markdownToHtml(content)

  const fullHtml = `
    <div style="font-family:'Noto Sans Telugu', 'Gautami', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#0f172a; line-height:1.6;">
      <!-- Header Banner -->
      <div style="background:linear-gradient(135deg, #0f172a, #1e293b); padding:20px 24px; border-radius:10px; color:#ffffff; margin-bottom:24px; border-left:6px solid #2563eb;">
        <div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#93c5fd; margin-bottom:4px;">
          ${displayExam.toUpperCase()} — CIVIL SERVICES PREPARATION
        </div>
        <h1 style="font-size:22px; font-weight:700; margin:0 0 8px; color:#ffffff; line-height:1.3;">
          ${displayTopic}
        </h1>
        <div style="font-size:11px; color:#cbd5e1;">
          Generated on: ${displayDate} · Official APPSC AI Prep Module
        </div>
      </div>

      <!-- Main Notes Body -->
      <div style="padding:0 4px;">
        ${cleanBodyHtml}
      </div>
    </div>
  `

  const safeFilename = `appscai_notes_${displayTopic.replace(/[^a-zA-Z0-9\u0C00-\u0C7F]/g, '_').slice(0, 40)}.pdf`
  await renderHtmlToPdf(fullHtml, safeFilename)
}

/**
 * Export Prelims MCQs with Questions, Options, Answer Key & Detailed Solutions (Telugu & English).
 */
export async function exportPrelimsToPdf({ topic, exam, questions = [], date }) {
  const displayTopic = topic || 'Prelims Practice Questions'
  const displayExam = exam || 'APPSC Prelims'
  const displayDate = date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  let questionsHtml = ''
  let solutionsHtml = ''

  questions.forEach((q, i) => {
    const qNum = i + 1
    const qText = q.question || q.q || `Question ${qNum}`
    const rawOptions = q.opts || q.options || {}
    const optionsArray = Array.isArray(rawOptions)
      ? rawOptions
      : ['A', 'B', 'C', 'D'].map((k) => rawOptions[k] || '')

    const optLabels = ['(A)', '(B)', '(C)', '(D)']

    const pyqTag = q.pyq_source || q.pyqSource || (q.source && q.source !== 'Knowledge Base' ? q.source : '')
    const typeTag = q.type ? q.type.replace(/_/g, ' ') : ''

    // Format question text with linebreaks for statements / match the following
    const formattedQText = formatInlineMarkdown(qText).replace(/\r?\n/g, '<br/>')

    // Section 1: Questions & Options
    questionsHtml += `
      <div style="margin-bottom:18px; padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
        <div style="font-weight:700; font-size:13.5px; color:#0f172a; margin-bottom:10px; line-height:1.5;">
          <span style="color:#2563eb; margin-right:4px;">Q${qNum}.</span> ${formattedQText}
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          ${optionsArray.map((opt, idx) => `
            <div style="font-size:12.5px; color:#334155; padding:6px 10px; background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; line-height:1.4;">
              <strong style="color:#2563eb; margin-right:4px;">${optLabels[idx] || ''}</strong> ${formatInlineMarkdown(opt)}
            </div>
          `).join('')}
        </div>
      </div>
    `

    // Section 2: Solutions
    const correctRaw = q.correct ?? q.ans ?? q.answer ?? q.correctAnswer ?? 'A'
    let correctLetter = 'A'
    let correctOptText = ''

    if (typeof correctRaw === 'number') {
      correctLetter = ['A', 'B', 'C', 'D'][correctRaw] || 'A'
      correctOptText = optionsArray[correctRaw] || ''
    } else if (typeof correctRaw === 'string') {
      const cleanUpper = correctRaw.trim().toUpperCase()
      if (cleanUpper.length === 1 && ['A', 'B', 'C', 'D'].includes(cleanUpper)) {
        correctLetter = cleanUpper
        const idx = ['A', 'B', 'C', 'D'].indexOf(cleanUpper)
        correctOptText = optionsArray[idx] || ''
      } else {
        correctOptText = correctRaw
      }
    }

    const rawExp = q.explanation || q.exp || 'Correct based on syllabus provisions and historical facts.'
    const formattedExplanation = formatInlineMarkdown(rawExp).replace(/\r?\n/g, '<br/>')

    solutionsHtml += `
      <div style="margin-bottom:18px; padding:14px; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; border-left:4px solid #10b981;">
        <div style="font-weight:700; font-size:13.5px; color:#0f172a; margin-bottom:8px; line-height:1.5;">
          <span style="color:#10b981; margin-right:4px;">Q${qNum}.</span> ${formattedQText}
        </div>
        <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:6px 12px; border-radius:6px; font-weight:700; font-size:12.5px; color:#065f46; margin-bottom:8px;">
          Correct Answer: [${correctLetter}] ${formatInlineMarkdown(correctOptText)}
        </div>
        <div style="font-size:12px; color:#334155; line-height:1.6; background:#f8fafc; padding:10px 12px; border-radius:6px; border:1px solid #e2e8f0;">
          <strong style="color:#0f172a; display:block; margin-bottom:4px;">360° Solution & Concept Analysis:</strong>
          ${formattedExplanation}
        </div>
      </div>
    `
  })

  const fullHtml = `
    <div style="font-family:'Noto Sans Telugu', 'Gautami', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#0f172a;">
      <!-- Header Banner -->
      <div style="background:linear-gradient(135deg, #0f172a, #1e293b); padding:20px 24px; border-radius:10px; color:#ffffff; margin-bottom:24px; border-left:6px solid #2563eb;">
        <div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#93c5fd; margin-bottom:4px;">
          ${displayExam.toUpperCase()} — PRELIMS PRACTICE TEST
        </div>
        <h1 style="font-size:22px; font-weight:700; margin:0 0 8px; color:#ffffff; line-height:1.3;">
          ${displayTopic}
        </h1>
        <div style="font-size:11px; color:#cbd5e1;">
          Total Questions: ${questions.length} · Date: ${displayDate}
        </div>
      </div>

      <!-- Section 1 -->
      <h2 style="font-size:15px; font-weight:700; color:#2563eb; margin:20px 0 12px; border-bottom:2px solid #bfdbfe; padding-bottom:4px; text-transform:uppercase; letter-spacing:0.05em;">
        Section 1: Questions & Options
      </h2>
      ${questionsHtml}

      <!-- Section 2 -->
      <div style="margin-top:30px;">
        <h2 style="font-size:15px; font-weight:700; color:#059669; margin:24px 0 12px; border-bottom:2px solid #a7f3d0; padding-bottom:4px; text-transform:uppercase; letter-spacing:0.05em;">
          Section 2: Answer Key & Detailed Solutions
        </h2>
        ${solutionsHtml}
      </div>
    </div>
  `

  const safeFilename = `appscai_mcq_${displayTopic.replace(/[^a-zA-Z0-9\u0C00-\u0C7F]/g, '_').slice(0, 40)}.pdf`
  await renderHtmlToPdf(fullHtml, safeFilename)
}

/**
 * Export Study Planner schedule to publication-ready PDF.
 */
export async function exportPlannerToPdf({ exam, targetDays, content, date }) {
  const planTitle = `${targetDays}-Day Study Plan — ${exam || 'Civil Services'}`
  const displayTopic = planTitle
  const displayExam = exam || 'APPSC'
  const displayDate = date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const cleanBodyHtml = markdownToHtml(content)

  const fullHtml = `
    <div style="font-family:'Noto Sans Telugu', 'Gautami', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#0f172a; line-height:1.6;">
      <!-- Header Banner -->
      <div style="background:linear-gradient(135deg, #0f172a, #1e293b); padding:20px 24px; border-radius:10px; color:#ffffff; margin-bottom:24px; border-left:6px solid #2563eb;">
        <div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#93c5fd; margin-bottom:4px;">
          ${displayExam.toUpperCase()} — STUDY PLAN SCHEDULE
        </div>
        <h1 style="font-size:22px; font-weight:700; margin:0 0 8px; color:#ffffff; line-height:1.3;">
          ${displayTopic}
        </h1>
        <div style="font-size:11px; color:#cbd5e1;">
          Generated on: ${displayDate} · Official APPSC AI Study Schedule
        </div>
      </div>

      <!-- Main Notes Body -->
      <div style="padding:0 4px;">
        ${cleanBodyHtml}
      </div>
    </div>
  `

  const safeFilename = `appscai_study_plan_${targetDays}days.pdf`
  await renderHtmlToPdf(fullHtml, safeFilename)
}

/**
 * Export Study Planner schedule to Excel CSV Spreadsheet.
 */
export function exportPlannerToCsv({ exam, targetDays, content }) {
  if (!content) return

  const rows = [
    ['APPSC AI Study Planner Schedule'],
    ['Target Exam', exam || 'APPSC'],
    ['Plan Duration', `${targetDays} Days`],
    ['Generated Date', new Date().toLocaleDateString('en-IN')],
    [],
    ['Day', 'Morning Block (4h Core)', 'Afternoon Block (3h State/CA)', 'Evening Block (1h Review)', 'Action Shortcuts'],
  ]

  const lines = content.split(/\r?\n/)
  let tableFound = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Match Markdown table row: | Day 1 | Morning | Afternoon | Evening | Actions |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .split('|')
        .map((c) => c.trim())
        .slice(1, -1) // remove empty outer elements

      // Skip divider row |---|---|
      if (cells.length >= 2 && cells[0].includes('---')) {
        continue
      }

      // Skip header row if it contains 'Day' & 'Block'
      if (cells[0].toLowerCase().includes('day') && cells.some((c) => c.toLowerCase().includes('block') || c.toLowerCase().includes('morning'))) {
        tableFound = true
        continue
      }

      if (cells.length >= 2) {
        tableFound = true
        const cleanCells = cells.map((cell) =>
          cell
            .replace(/📖\s*/g, '[Notes] ')
            .replace(/⚡\s*/g, '[MCQ] ')
        )
        rows.push(cleanCells)
      }
    }
  }

  // Fallback if content was not formatted as a markdown table
  if (!tableFound) {
    let currentDay = ''
    let currentTasks = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('### Day ') || trimmed.startsWith('## Day ') || trimmed.startsWith('Day ')) {
        if (currentDay) {
          rows.push([currentDay, 'Study Schedule', currentTasks.join(' | ')])
        }
        currentDay = trimmed.replace(/^#+\s*/, '')
        currentTasks = []
      } else if (trimmed && currentDay) {
        const cleanLine = trimmed
          .replace(/^[\*\-\#]+\s*/, '')
          .replace(/📖\s*/g, '[Notes] ')
          .replace(/⚡\s*/g, '[MCQ] ')
        if (cleanLine) currentTasks.push(cleanLine)
      }
    }
    if (currentDay) {
      rows.push([currentDay, 'Study Schedule', currentTasks.join(' | ')])
    }
  }

  const csvContent = rows
    .map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `appscai_study_plan_${targetDays}days.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

