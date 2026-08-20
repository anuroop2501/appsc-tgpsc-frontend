import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Sparkles,
  Download,
  Copy,
  CheckCheck,
  Loader2,
  Target,
  Flame,
  Sliders,
  FileSpreadsheet,
} from 'lucide-react'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { exportPlannerToPdf, exportPlannerToCsv } from '../lib/exportPdf'
import useAuthStore from '../store/authStore'

const EXAMS = ['APPSC Group 1', 'APPSC Group 2']
const DURATION_PRESETS = [
  { label: '7 Days (1 Wk)', days: 7 },
  { label: '15 Days (Sprint)', days: 15 },
  { label: '30 Days (1 Mo)', days: 30 },
  { label: '45 Days (Mid)', days: 45 },
  { label: '60 Days (2 Mo)', days: 60 },
  { label: '90 Days (3 Mo)', days: 90 },
  { label: '120 Days (4 Mo)', days: 120 },
  { label: '180 Days (6 Mo)', days: 180 },
]

const BASE_URL = import.meta.env.VITE_API_URL || ''

const PlannerPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [exam, setExam] = useState(user?.target_exam || 'APPSC Group 1')
  const [targetDays, setTargetDays] = useState(30)
  const [isCustomDays, setIsCustomDays] = useState(false)
  const [dailyHours, setDailyHours] = useState(8)
  const [prepLevel, setPrepLevel] = useState('Intermediate')
  const [focusTopics, setFocusTopics] = useState('')

  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const abortRef = useRef(null)

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  const handleGenerate = async () => {
    if (!exam) return

    setLoading(true)
    setContent('')
    setErrorMsg('')

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`${BASE_URL}/api/ai/planner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          exam,
          targetDays,
          dailyHours,
          prepLevel,
          focusTopics,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        setErrorMsg(errData.error || errData.message || `Failed to generate plan (HTTP ${response.status})`)
        setLoading(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let accumulated = ''
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':')) continue

          if (trimmed.startsWith('data:')) {
            const raw = trimmed.replace(/^data:\s*/, '').trim()
            if (raw === '[DONE]') break
            try {
              const parsed = JSON.parse(raw)
              if (parsed.text) {
                accumulated += parsed.text
                setContent(accumulated)
              }
              if (parsed.error) {
                setErrorMsg(parsed.error)
              }
            } catch (e) {
              // Ignore non-JSON lines
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Study plan generation error:', err)
        setErrorMsg('Network error occurred while generating study plan.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const extractQuickTopics = () => {
    if (!content) return []
    const topics = []
    const tableRows = content.split('\n')
    for (const line of tableRows) {
      if (line.includes('| Day ') || line.includes('|Day ')) {
        const parts = line.split('|').map((p) => p.trim()).filter(Boolean)
        if (parts.length >= 2) {
          const topicCandidate = parts[1].replace(/📖\s*|⚡\s*|\[Notes\]|\[MCQ\]/g, '').trim()
          if (topicCandidate && !topicCandidate.toLowerCase().includes('morning')) {
            topics.push(topicCandidate)
          }
        }
      }
    }
    if (topics.length === 0) {
      const matches = content.match(/### Day \d+:[^\n]+/g) || []
      return matches.slice(0, 12).map((m) => m.replace(/### Day \d+:\s*/, '').trim())
    }
    return topics.slice(0, 12)
  }

  const quickTopics = extractQuickTopics()

  return (
    <div style={{ maxWidth: 1000, animation: 'fadeIn 0.4s ease forwards', paddingBottom: 40 }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--indigo-dim)', color: 'var(--indigo)', flexShrink: 0 }}>
            <Calendar size={20} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 560, fontSize: 28, margin: 0, color: 'var(--text-1)' }}>
            Study Planner
          </h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 0 56px', lineHeight: 1.5 }}>
          Day-by-day timetables designed for APPSC syllabus, customized daily schedules, and quick notes/MCQ drills
        </p>
      </div>

      {/* ── Configuration Form ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 560, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 20px', color: 'var(--text-1)' }}>
          <Target size={16} style={{ color: 'var(--indigo)' }} />
          Configure Your Study Plan
        </h2>

        {errorMsg && (
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 13, marginBottom: 18 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
          {/* Target Exam */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 8 }}>
              Target Exam
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {EXAMS.map((e) => {
                const isSel = exam === e
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setExam(e)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: isSel ? 600 : 500,
                      background: isSel ? 'var(--indigo-dim)' : 'var(--surface-elevated)',
                      color: isSel ? 'var(--indigo)' : 'var(--text-2)',
                      border: isSel ? '1px solid var(--indigo-border)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {e}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Daily Study Hours */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 8 }}>
              Daily Study Time
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => setDailyHours((h) => Math.max(4, h - 1))}
                className="btn-ghost"
                style={{ width: 42, height: 42, padding: 0, fontSize: 18, fontWeight: 700 }}
              >
                -
              </button>
              <div
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-1)',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <Clock size={15} style={{ color: 'var(--indigo)' }} />
                <span>{dailyHours} Hours / Day</span>
              </div>
              <button
                type="button"
                onClick={() => setDailyHours((h) => Math.min(14, h + 1))}
                className="btn-ghost"
                style={{ width: 42, height: 42, padding: 0, fontSize: 18, fontWeight: 700 }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Plan Duration Selection */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sliders size={13} style={{ color: 'var(--indigo)' }} />
              Plan Duration (Days)
            </label>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'var(--indigo-dim)', color: 'var(--indigo)', border: '1px solid var(--indigo-border)', fontFamily: 'var(--font-mono)' }}>
              {targetDays} Days ({Math.round((targetDays / 30) * 10) / 10} Mo)
            </span>
          </div>

          {/* Preset Chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {DURATION_PRESETS.map((p) => {
              const isSelected = !isCustomDays && targetDays === p.days
              return (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => {
                    setTargetDays(p.days)
                    setIsCustomDays(false)
                  }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 9,
                    fontSize: 12.5,
                    fontWeight: isSelected ? 600 : 500,
                    background: isSelected ? 'var(--indigo)' : 'var(--surface-elevated)',
                    color: isSelected ? '#ffffff' : 'var(--text-2)',
                    border: isSelected ? '1px solid var(--indigo)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.label}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setIsCustomDays(true)}
              style={{
                padding: '7px 14px',
                borderRadius: 9,
                fontSize: 12.5,
                fontWeight: isCustomDays ? 600 : 500,
                background: isCustomDays ? 'var(--indigo)' : 'var(--surface-elevated)',
                color: isCustomDays ? '#ffffff' : 'var(--text-2)',
                border: isCustomDays ? '1px solid var(--indigo)' : '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              Custom...
            </button>
          </div>

          {isCustomDays && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-1)' }}>Days:</span>
              <input
                type="number"
                min="7"
                max="180"
                value={targetDays}
                onChange={(e) => setTargetDays(Math.max(7, Math.min(180, parseInt(e.target.value, 10) || 7)))}
                className="input"
                style={{ width: 100, height: 36, padding: '4px 10px' }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Min 7, Max 180 days</span>
            </div>
          )}
        </div>

        {/* Preparation Level & Weak Subjects */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 8 }}>
              Preparation Level
            </label>
            <select
              value={prepLevel}
              onChange={(e) => setPrepLevel(e.target.value)}
              className="input select"
            >
              <option value="Beginner">Beginner (Foundation &amp; Concept Building)</option>
              <option value="Intermediate">Intermediate (Comprehensive Coverage)</option>
              <option value="Revision Sprint">Revision Sprint (Rapid Mock Drills)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 8 }}>
              Focus Subjects (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. AP Economy, Indian History, S&amp;T"
              value={focusTopics}
              onChange={(e) => setFocusTopics(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', height: 46, fontSize: 14 }}
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin-slow" />
              Generating Custom {targetDays}-Day Study Plan...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate {targetDays}-Day Study Plan • 50 Credits ({dailyHours}h Daily)
            </>
          )}
        </button>
      </div>

      {/* ── Generated Plan Output View ── */}
      {content && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeIn 0.3s ease forwards' }}>
          {/* Action Bar */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="tag" style={{ background: 'var(--indigo-dim)', color: 'var(--indigo)' }}>
                  {exam}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  {targetDays} Days • {dailyHours}h/Day
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 560, margin: 0, color: 'var(--text-1)' }}>
                Your Day-by-Day Study Schedule
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={handleCopy}
                className="btn-ghost"
                style={{ padding: '7px 14px', fontSize: 12 }}
              >
                {copied ? <CheckCheck size={13} style={{ color: 'var(--emerald)' }} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy Plan'}
              </button>

              <button
                onClick={() =>
                  exportPlannerToCsv({
                    exam,
                    targetDays,
                    content,
                  })
                }
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8, background: 'var(--emerald-dim)', color: 'var(--emerald)', border: '1px solid var(--emerald-border)', cursor: 'pointer' }}
              >
                <FileSpreadsheet size={13} />
                Export CSV
              </button>

              <button
                onClick={() =>
                  exportPlannerToPdf({
                    exam,
                    targetDays,
                    content,
                    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                  })
                }
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8, background: 'var(--indigo-dim)', color: 'var(--indigo)', border: '1px solid var(--indigo-border)', cursor: 'pointer' }}
              >
                <Download size={13} />
                Download PDF
              </button>
            </div>
          </div>

          {/* Quick Module Launchers */}
          {quickTopics.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 10 }}>
                <Flame size={13} style={{ color: 'var(--gold-hi)' }} />
                Quick Action Shortcuts
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {quickTopics.map((top, idx) => (
                  <div
                    key={idx}
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontWeight: 500, color: 'var(--text-1)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {top}
                    </span>
                    <button
                      onClick={() => navigate(`/notes?topic=${encodeURIComponent(top)}&exam=${encodeURIComponent(exam)}`)}
                      style={{ padding: '2px 6px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, background: 'var(--emerald-dim)', color: 'var(--emerald)', border: 'none', cursor: 'pointer' }}
                    >
                      Notes
                    </button>
                    <button
                      onClick={() => navigate(`/prelims?topic=${encodeURIComponent(top)}&exam=${encodeURIComponent(exam)}`)}
                      style={{ padding: '2px 6px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, background: 'var(--indigo-dim)', color: 'var(--indigo)', border: 'none', cursor: 'pointer' }}
                    >
                      MCQs
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timetable Markdown */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 32px' }} className="prose-dark">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      )}
    </div>
  )
}

export default PlannerPage
