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
  CheckCircle,
  Sliders,
  FileSpreadsheet,
} from 'lucide-react'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { exportPlannerToPdf, exportPlannerToCsv } from '../lib/exportPdf'
import useAuthStore from '../store/authStore'

const EXAMS = ['APPSC Group 1', 'APPSC Group 2', 'TGPSC Group 1', 'TGPSC Group 2']
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

  // Extract day topics to build quick actions
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
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* ── Header ── */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div className="flex items-center gap-3.5 mb-2">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #1579E6, #2563EB)', color: '#FFFFFF' }}
          >
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
              Your Study Planner
            </h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
              Comprehensive day-by-day timetables designed for APPSC & TGPSC syllabus, 8-hour daily schedules, and direct integration with Notes & MCQs
            </p>
          </div>
        </div>
      </div>

      {/* ── Configuration Form ── */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
          <Target size={18} style={{ color: 'var(--color-accent)' }} />
          Configure Your Study Plan
        </h2>

        {errorMsg && (
          <div className="p-4 rounded-2xl text-xs font-semibold flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Exam */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
              Target Exam
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EXAMS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setExam(e)}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center"
                  style={{
                    background: exam === e ? 'linear-gradient(135deg, #1579E6, #2563EB)' : 'var(--color-surface)',
                    color: exam === e ? '#FFFFFF' : 'var(--color-text)',
                    border: exam === e ? '1px solid #1579E6' : '1px solid var(--color-border)',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Study Hours Stepper */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
              Daily Study Time
            </label>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setDailyHours((h) => Math.max(4, h - 1))}
                className="w-11 h-11 rounded-xl text-lg font-bold flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                title="Decrease Hours"
              >
                -
              </button>
              <div
                className="flex-1 py-2.5 px-4 rounded-xl text-center font-extrabold text-sm flex items-center justify-center gap-2 shadow-inner"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <Clock size={16} style={{ color: 'var(--color-accent)' }} />
                <span>{dailyHours} Hours / Day</span>
              </div>
              <button
                type="button"
                onClick={() => setDailyHours((h) => Math.min(14, h + 1))}
                className="w-11 h-11 rounded-xl text-lg font-bold flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                title="Increase Hours"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Plan Duration Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-muted)' }}>
              <Sliders size={14} style={{ color: 'var(--color-accent)' }} />
              Plan Duration (Days)
            </label>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full" style={{ background: 'rgba(37,99,235,0.15)', color: 'var(--color-accent)', border: '1px solid rgba(37,99,235,0.3)' }}>
              {targetDays} Days Plan ({Math.round((targetDays / 30) * 10) / 10} Months)
            </span>
          </div>

          {/* Preset Chips */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
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
                  className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: isSelected ? 'linear-gradient(135deg, #1579E6, #2563EB)' : 'var(--color-surface)',
                    color: isSelected ? '#FFFFFF' : 'var(--color-text)',
                    border: isSelected ? '1px solid #1579E6' : '1px solid var(--color-border)',
                    boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
                  }}
                >
                  {p.label}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setIsCustomDays(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: isCustomDays ? 'linear-gradient(135deg, #1579E6, #2563EB)' : 'var(--color-surface)',
                color: isCustomDays ? '#FFFFFF' : 'var(--color-text)',
                border: isCustomDays ? '1px solid #1579E6' : '1px solid var(--color-border)',
              }}
            >
              Custom Days...
            </button>
          </div>

          {/* Custom Days Input Box */}
          {isCustomDays && (
            <div className="p-4 rounded-2xl flex items-center gap-3 animate-fade-in" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <label className="text-xs font-bold whitespace-nowrap" style={{ color: 'var(--color-text)' }}>
                Enter Custom Duration:
              </label>
              <input
                type="number"
                min="7"
                max="180"
                value={targetDays}
                onChange={(e) => setTargetDays(Math.max(7, Math.min(180, parseInt(e.target.value, 10) || 7)))}
                placeholder="e.g. 75, 100, 150"
                className="input-field max-w-[140px]"
              />
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Days (Min 7 days, Max 180 days / 6 months)
              </span>
            </div>
          )}
        </div>

        {/* Preparation Stage & Focus Topics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
              Preparation Level
            </label>
            <select
              value={prepLevel}
              onChange={(e) => setPrepLevel(e.target.value)}
              className="input-field"
            >
              <option value="Beginner">Beginner (Foundation & Concept Building)</option>
              <option value="Intermediate">Intermediate (Comprehensive Syllabus Coverage)</option>
              <option value="Revision Sprint">Revision Sprint (Rapid Mock & Topic Drills)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
              Focus / Weak Subjects (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. AP Economy, Indian History, Science & Tech"
              value={focusTopics}
              onChange={(e) => setFocusTopics(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Submit CTA */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #1579E6, #2563EB)',
            color: '#FFFFFF',
            boxShadow: '0 4px 20px rgba(37,99,235,0.3)',
          }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating Custom {targetDays}-Day Study Plan...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate {targetDays}-Day Study Plan ({dailyHours}h Daily Schedule)
            </>
          )}
        </button>
      </div>

      {/* ── Generated Plan Output View ── */}
      {content && (
        <div className="space-y-6 animate-fade-in">
          {/* Action Bar */}
          <div className="glass-card p-4 sm:p-6 rounded-3xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-3 py-0.5 rounded-full font-bold" style={{ background: 'rgba(37,99,235,0.15)', color: 'var(--color-accent)' }}>
                  {exam}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {targetDays} Days • {dailyHours} Hours/Day Schedule
                </span>
              </div>
              <h3 className="text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                Your Day-by-Day Study Schedule
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                style={{
                  background: copied ? 'rgba(61,214,140,0.15)' : 'var(--color-surface)',
                  color: copied ? 'var(--color-green)' : 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
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
                className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all hover:scale-105"
                style={{
                  background: 'rgba(16,185,129,0.15)',
                  color: '#10B981',
                  border: '1px solid rgba(16,185,129,0.3)',
                }}
              >
                <FileSpreadsheet size={14} />
                Export Excel (.csv)
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
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #1579E6, #2563EB)', boxShadow: '0 4px 15px rgba(37,99,235,0.3)' }}
              >
                <Download size={14} />
                Download PDF
              </button>
            </div>
          </div>

          {/* Quick Module Launchers Bar */}
          {quickTopics.length > 0 && (
            <div className="glass-card p-5 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                <Flame size={14} style={{ color: 'var(--color-gold)' }} />
                Quick Action Shortcuts for Topics in Your Plan
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {quickTopics.map((top, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 flex items-center gap-1.5 p-2 rounded-xl text-xs"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                  >
                    <span className="font-semibold truncate max-w-[140px]" style={{ color: 'var(--color-text)' }}>
                      {top}
                    </span>
                    <button
                      onClick={() => navigate(`/notes?topic=${encodeURIComponent(top)}&exam=${encodeURIComponent(exam)}`)}
                      className="px-2 py-0.5 rounded-md text-[11px] font-bold transition-all hover:scale-105"
                      style={{ background: 'rgba(123,94,248,0.15)', color: '#7B5EF8' }}
                      title="Generate Notes"
                    >
                      📖 Notes
                    </button>
                    <button
                      onClick={() => navigate(`/prelims?topic=${encodeURIComponent(top)}&exam=${encodeURIComponent(exam)}`)}
                      className="px-2 py-0.5 rounded-md text-[11px] font-bold transition-all hover:scale-105"
                      style={{ background: 'rgba(37,99,235,0.15)', color: 'var(--color-accent)' }}
                      title="Practice 10 MCQs"
                    >
                      ⚡ MCQs
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Markdown Timetable Container */}
          <div className="glass-card p-6 sm:p-10 rounded-3xl" style={{ background: 'var(--color-card)' }}>
            <MarkdownRenderer content={content} />
          </div>
        </div>
      )}
    </div>
  )
}

export default PlannerPage
