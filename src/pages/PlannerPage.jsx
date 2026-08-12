import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  HelpCircle,
  Download,
  CheckCircle2,
  Circle,
  Copy,
  CheckCheck,
  RotateCcw,
  Loader2,
  Layers,
  Target,
  ArrowRight,
  Flame,
} from 'lucide-react'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { exportPlannerToPdf } from '../lib/exportPdf'
import useAuthStore from '../store/authStore'

const EXAMS = ['APPSC Group 1', 'APPSC Group 2', 'TGPSC Group 1', 'TGPSC Group 2']
const DURATION_PRESETS = [7, 15, 30, 45, 60]

const PlannerPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [exam, setExam] = useState(user?.target_exam || 'APPSC Group 1')
  const [targetDays, setTargetDays] = useState(30)
  const [dailyHours, setDailyHours] = useState(8)
  const [prepLevel, setPrepLevel] = useState('Intermediate')
  const [focusTopics, setFocusTopics] = useState('')

  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [copied, setCopied] = useState(false)
  const [completedDays, setCompletedDays] = useState({})

  const streamRef = useRef(null)

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.abort()
    }
  }, [])

  const handleGenerate = async () => {
    if (!exam) return

    setLoading(true)
    setContent('')
    setCompletedDays({})

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/ai/planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exam,
          targetDays,
          dailyHours,
          prepLevel,
          focusTopics,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        alert(errData.error || 'Failed to generate study plan.')
        setLoading(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.replace('data: ', '').trim()
            if (raw === '[DONE]') break
            try {
              const parsed = JSON.parse(raw)
              if (parsed.text) {
                accumulated += parsed.text
                setContent(accumulated)
              }
            } catch (e) {
              // Ignore non-json
            }
          }
        }
      }
    } catch (err) {
      console.error('Study plan generation failed:', err)
      alert('An error occurred while streaming your study plan.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleDayComplete = (dayNum) => {
    setCompletedDays((prev) => ({
      ...prev,
      [dayNum]: !prev[dayNum],
    }))
  }

  // Calculate completed count and percent
  const completedCount = Object.values(completedDays).filter(Boolean).length
  const progressPercent = Math.round((completedCount / targetDays) * 100)

  // Extract day topics to build quick actions
  const extractQuickTopics = () => {
    if (!content) return []
    const dayMatches = content.match(/### Day \d+:[^\n]+/g) || []
    return dayMatches.slice(0, 10).map((m) => {
      const topicName = m.replace(/### Day \d+:\s*/, '').trim()
      return topicName
    })
  }

  const quickTopics = extractQuickTopics()

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* ── Header ── */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #1579E6, #2563EB)', color: '#FFFFFF' }}
          >
            <Calendar size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
              AI Study Planner
            </h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
              Holistic day-by-day timetables designed for APPSC & TGPSC syllabus coverage with 8-hour daily schedules
            </p>
          </div>
        </div>
      </div>

      {/* ── Input Form ── */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
          <Target size={18} style={{ color: 'var(--color-accent)' }} />
          Configure Your Study Plan
        </h2>

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

          {/* Duration in Days */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                Target Duration (Days)
              </label>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(37,99,235,0.15)', color: 'var(--color-accent)' }}>
                {targetDays} Days
              </span>
            </div>

            <input
              type="range"
              min="7"
              max="90"
              value={targetDays}
              onChange={(e) => setTargetDays(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-3"
              style={{ background: 'var(--color-border)' }}
            />

            <div className="flex items-center gap-2 flex-wrap">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTargetDays(preset)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: targetDays === preset ? 'rgba(37,99,235,0.2)' : 'var(--color-surface)',
                    color: targetDays === preset ? 'var(--color-accent)' : 'var(--color-muted)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {preset}d
                </button>
              ))}
            </div>
          </div>

          {/* Daily Study Hours */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
              Daily Study Hours
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="4"
                  max="14"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseInt(e.target.value, 10) || 8)}
                  className="input-field pl-10"
                />
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                hrs / day (8h recommended)
              </span>
            </div>
          </div>

          {/* Preparation Stage */}
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
        </div>

        {/* Optional Focus Topics */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
            Focus / Weak Subjects (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. AP Economy, Indian History, Science & Tech, Governance"
            value={focusTopics}
            onChange={(e) => setFocusTopics(e.target.value)}
            className="input-field"
          />
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
              Generating Custom {targetDays}-Day Plan...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate {targetDays}-Day Study Plan (8h Daily Schedule)
            </>
          )}
        </button>
      </div>

      {/* ── Generated Plan View ── */}
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
                  {targetDays} Days • {dailyHours} Hours/Day
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
