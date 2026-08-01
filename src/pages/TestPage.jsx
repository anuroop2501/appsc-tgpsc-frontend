import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ClipboardList, Clock, Zap, ChevronLeft, ChevronRight,
  Flag, CheckCircle, XCircle, BarChart2, RotateCcw,
  LayoutDashboard, AlertTriangle, Loader2, Lightbulb,
  Trophy, Target, TrendingUp, Eye, History
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { startTestJob, getTestJobStatus, submitTestResults, getTestHistory, getTestDetail } from '../api/test'
import useAuthStore from '../store/authStore'
import PricingModal from '../components/PricingModal'
import FormattedQuestionText from '../components/FormattedQuestionText'

// ─── Constants ────────────────────────────────────────────────────────────────
const EXAMS = ['APPSC Group 1', 'APPSC Group 2']

const DURATION_OPTIONS = [
  { minutes: 30,  questions: 50,  label: '30 Minutes',  sublabel: '50 Questions', color: '#3DD68C', glow: 'rgba(61,214,140,0.3)' },
  { minutes: 60,  questions: 100, label: '60 Minutes',  sublabel: '100 Questions', color: '#4F8EF7', glow: 'rgba(79,142,247,0.3)' },
  { minutes: 120, questions: 200, label: '120 Minutes', sublabel: '200 Questions', color: '#F5A623', glow: 'rgba(245,166,35,0.3)' },
]

const PHASES = { SETUP: 'setup', LOADING: 'loading', TEST: 'test', RESULTS: 'results' }

const OPTION_LABELS = ['A', 'B', 'C', 'D']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Parse question from API format to normalized internal format
function normalizeQuestion(q, index) {
  const rawOptions = q.opts || q.options || {}
  const optionsArray = Array.isArray(rawOptions)
    ? rawOptions
    : ['A', 'B', 'C', 'D'].map((k) => rawOptions[k] || '')

  const correctRaw = q.correct ?? q.ans ?? q.answer ?? q.correctAnswer ?? 'A'
  const correctIndex = typeof correctRaw === 'string' && correctRaw.length === 1
    ? ['A', 'B', 'C', 'D'].indexOf(correctRaw.toUpperCase())
    : Number(correctRaw)

  return {
    id: index,
    question: q.question || q.q || '',
    options: optionsArray,
    correct: correctIndex,
    explanation: q.explanation || q.exp || '',
    difficulty: q.difficulty || 'medium',
    topic: q.topic || '',
    subject: q.subject || '',
    type: q.type || 'analytical',
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Setup Phase
const SetupScreen = ({ onStart }) => {
  const user = useAuthStore((s) => s.user)
  const defaultExam = user?.targetExam || EXAMS[0]
  const [exam, setExam] = useState(defaultExam)
  const [selected, setSelected] = useState(DURATION_OPTIONS[1]) // default 60 min

  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [reviewData, setReviewData] = useState(null)
  const [loadingReview, setLoadingReview] = useState(false)

  useEffect(() => {
    getTestHistory()
      .then((data) => setHistory(data.tests || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [])

  const handleReview = async (testId) => {
    setLoadingReview(true)
    try {
      const data = await getTestDetail(testId)
      setReviewData(data)
    } catch (err) {
      console.error('Failed to load test detail:', err)
    } finally {
      setLoadingReview(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, #4F8EF7, #7B5EF8)', boxShadow: '0 8px 24px rgba(79,142,247,0.4)' }}
        >
          <ClipboardList size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
          Full Mock Test
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Simulate the real exam experience with full-syllabus questions, countdown timer & instant results
        </p>
      </div>

      {/* Exam Selector */}
      <div className="glass-card p-6 mb-5">
        <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text)', fontFamily: 'Sora, sans-serif' }}>
          Select Exam
        </label>
        <div className="grid grid-cols-2 gap-3">
          {EXAMS.map((e) => (
            <button
              key={e}
              onClick={() => setExam(e)}
              className="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left"
              style={{
                background: exam === e ? 'rgba(79,142,247,0.15)' : 'rgba(42,52,80,0.4)',
                border: exam === e ? '1px solid rgba(79,142,247,0.6)' : '1px solid var(--color-border)',
                color: exam === e ? 'var(--color-accent)' : 'var(--color-muted)',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Duration Selector */}
      <div className="glass-card p-6 mb-6">
        <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text)', fontFamily: 'Sora, sans-serif' }}>
          Choose Test Duration
        </label>
        <div className="grid grid-cols-3 gap-4">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.minutes}
              onClick={() => setSelected(opt)}
              className="flex flex-col items-center p-5 rounded-2xl transition-all duration-200 relative"
              style={{
                background: selected.minutes === opt.minutes
                  ? `rgba(${opt.color === '#3DD68C' ? '61,214,140' : opt.color === '#4F8EF7' ? '79,142,247' : '245,166,35'},0.1)`
                  : 'rgba(42,52,80,0.4)',
                border: selected.minutes === opt.minutes
                  ? `2px solid ${opt.color}`
                  : '2px solid var(--color-border)',
                boxShadow: selected.minutes === opt.minutes ? `0 4px 20px ${opt.glow}` : 'none',
              }}
            >
              <Clock size={22} style={{ color: selected.minutes === opt.minutes ? opt.color : 'var(--color-muted)', marginBottom: 10 }} />
              <span className="text-lg font-bold mb-1" style={{ color: selected.minutes === opt.minutes ? opt.color : 'var(--color-text)', fontFamily: 'Sora, sans-serif' }}>
                {opt.label}
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                {opt.sublabel}
              </span>
              {selected.minutes === opt.minutes && (
                <div
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: opt.color }}
                >
                  <CheckCircle size={12} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Info card */}
      <div
        className="flex items-start gap-3 p-4 rounded-xl mb-6"
        style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)' }}
      >
        <AlertTriangle size={16} style={{ color: '#F5A623', flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          <strong style={{ color: '#F5A623' }}>Important:</strong> Questions will be generated from the entire syllabus.
          Generation runs in the background. Timer starts after questions are loaded.
          Auto-submit happens when timer expires.
        </p>
      </div>

      {/* Start Button */}
      <button
        onClick={() => onStart(exam, selected.questions, selected.minutes)}
        className="btn-primary w-full justify-center text-base py-4"
        style={{ borderRadius: 16, fontSize: 15 }}
      >
        <Zap size={18} />
        Start {selected.label} Test — {selected.questions} Questions
      </button>

      {/* ── Test History ── */}
      {history.length > 0 && (
        <div className="glass-card p-5 mt-6">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
            <History size={18} style={{ color: 'var(--color-accent)' }} /> Recent Tests
          </h3>
          <div className="space-y-3">
            {history.slice(0, 10).map((t) => {
              const scorePct = t.score != null && t.question_count > 0 ? Math.round((t.score / t.question_count) * 100) : null
              const date = new Date(t.started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              const time = new Date(t.started_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.01]"
                  style={{ background: 'rgba(42,52,80,0.4)', border: '1px solid var(--color-border)' }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{t.exam}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(79,142,247,0.15)', color: 'var(--color-accent)' }}>
                        {t.question_count}Q · {t.duration_minutes}m
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{date} at {time}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {scorePct !== null ? (
                      <span
                        className="text-sm font-bold px-3 py-1 rounded-lg"
                        style={{
                          background: scorePct >= 60 ? 'rgba(61,214,140,0.15)' : 'rgba(247,111,111,0.15)',
                          color: scorePct >= 60 ? '#3DD68C' : '#F76F6F',
                        }}
                      >
                        {scorePct}%
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>In Progress</span>
                    )}
                    {t.completed_at && (
                      <button
                        onClick={() => handleReview(t.id)}
                        className="p-2 rounded-lg transition-all hover:scale-110"
                        style={{ background: 'rgba(79,142,247,0.15)', color: 'var(--color-accent)' }}
                        title="Review test"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Review Modal ── */}
      {reviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-2xl p-6 mx-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                Test Review — {reviewData.test?.exam}
              </h3>
              <button onClick={() => setReviewData(null)} className="p-2 rounded-lg hover:scale-110" style={{ color: 'var(--color-muted)' }}>✕</button>
            </div>
            <div className="flex gap-4 mb-5 text-sm">
              <span style={{ color: '#3DD68C' }}>✓ {reviewData.test?.score || 0} correct</span>
              <span style={{ color: '#F76F6F' }}>✗ {(reviewData.test?.total_attempted || 0) - (reviewData.test?.score || 0)} wrong</span>
              <span style={{ color: 'var(--color-muted)' }}>{(reviewData.test?.question_count || 0) - (reviewData.test?.total_attempted || 0)} skipped</span>
            </div>
            <div className="space-y-4">
              {(reviewData.questions || []).map((q, idx) => {
                const opts = typeof q.options === 'object' && !Array.isArray(q.options)
                  ? ['A','B','C','D'].map(k => q.options[k])
                  : (q.options || [])
                return (
                  <div key={idx} className="p-4 rounded-xl" style={{ background: 'rgba(42,52,80,0.4)', border: '1px solid var(--color-border)' }}>
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      <span className="mr-2" style={{ color: 'var(--color-accent)' }}>Q{idx + 1}.</span>{q.question}
                    </p>
                    <div className="grid grid-cols-1 gap-1.5 mb-2">
                      {opts.map((opt, oi) => {
                        const letter = ['A','B','C','D'][oi]
                        const isCorrect = letter === q.correct
                        const isUserPick = letter === q.userAnswer
                        const bg = isCorrect ? 'rgba(61,214,140,0.12)' : isUserPick ? 'rgba(247,111,111,0.12)' : 'transparent'
                        const border = isCorrect ? 'rgba(61,214,140,0.4)' : isUserPick ? 'rgba(247,111,111,0.4)' : 'var(--color-border)'
                        const color = isCorrect ? '#3DD68C' : isUserPick ? '#F76F6F' : 'var(--color-text)'
                        return (
                          <div key={oi} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: bg, border: `1px solid ${border}`, color }}>
                            <span className="font-bold">{letter}.</span> {opt}
                            {isCorrect && <CheckCircle size={14} className="ml-auto" />}
                            {isUserPick && !isCorrect && <XCircle size={14} className="ml-auto" />}
                          </div>
                        )
                      })}
                    </div>
                    {q.explanation && (
                      <div className="text-xs p-2 rounded-lg" style={{ background: 'rgba(79,142,247,0.08)', color: 'var(--color-muted)' }}>
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Loading Phase
const LoadingScreen = ({ exam, questionCount, durationMinutes, progressInfo }) => {
  const pct = progressInfo?.progressPct || 5
  const completed = progressInfo?.completedBatches || 0
  const total = progressInfo?.totalBatches || Math.ceil(questionCount / 10)

  return (
    <div className="max-w-md mx-auto text-center py-12 animate-fade-in">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 relative"
        style={{ background: 'linear-gradient(135deg, #4F8EF7, #7B5EF8)', boxShadow: '0 8px 32px rgba(79,142,247,0.4)' }}
      >
        <Loader2 size={32} className="text-white animate-spin" />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
        Preparing Your Test Paper
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
        Curating <strong style={{ color: 'var(--color-accent)' }}>{questionCount} high-quality exam questions</strong> from the entire {exam} syllabus.
      </p>

      {/* Real-time Progress Bar */}
      <div className="glass-card p-5 mb-5 text-left">
        <div className="flex justify-between items-center text-xs font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          <span>Generation Progress</span>
          <span style={{ color: 'var(--color-accent)' }}>{pct}%</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(42,52,80,0.6)', border: '1px solid var(--color-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #4F8EF7, #3DD68C)',
              boxShadow: '0 0 12px rgba(79,142,247,0.6)',
            }}
          />
        </div>
        <div className="flex justify-between text-xs" style={{ color: 'var(--color-muted)' }}>
          <span>{total > 0 ? `Completed ${completed} of ${total} batches` : 'Planning syllabus blueprint...'}</span>
          <span>{progressInfo?.questionsGenerated || 0} / {questionCount} Qs</span>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Questions', value: questionCount },
            { label: 'Duration', value: `${durationMinutes}m` },
            { label: 'Syllabus', value: 'Full' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-base font-bold mb-0.5" style={{ color: 'var(--color-accent)', fontFamily: 'Sora, sans-serif' }}>{value}</p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Timer component
const Timer = ({ secondsLeft, totalSeconds }) => {
  const pct = secondsLeft / totalSeconds
  const isLow = secondsLeft <= 300 // 5 min warning
  const isVeryLow = secondsLeft <= 60
  const color = isVeryLow ? '#F76F6F' : isLow ? '#F5A623' : '#3DD68C'

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
      style={{
        background: isVeryLow ? 'rgba(247,111,111,0.1)' : isLow ? 'rgba(245,166,35,0.1)' : 'rgba(61,214,140,0.08)',
        border: `1px solid ${isVeryLow ? 'rgba(247,111,111,0.4)' : isLow ? 'rgba(245,166,35,0.3)' : 'rgba(61,214,140,0.25)'}`,
      }}
    >
      <Clock size={15} style={{ color, animation: isVeryLow ? 'pulse 1s ease-in-out infinite' : 'none' }} />
      <span
        className="font-mono font-bold text-base"
        style={{ color, fontFamily: 'Sora, sans-serif', letterSpacing: '0.05em' }}
      >
        {formatTime(secondsLeft)}
      </span>
    </div>
  )
}

// Question Navigator Panel
const QuestionNav = ({ total, current, answers, flagged, onJump }) => {
  return (
    <div className="glass-card p-4">
      <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--color-muted)', fontFamily: 'Sora, sans-serif' }}>
        Questions
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const isAnswered = answers[i] !== undefined
          const isFlagged = flagged.has(i)
          const isCurrent = i === current
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              className="w-full aspect-square rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center"
              title={`Q${i + 1}${isFlagged ? ' (Flagged)' : ''}`}
              style={{
                background: isCurrent
                  ? 'linear-gradient(135deg, #4F8EF7, #7B5EF8)'
                  : isFlagged
                  ? 'rgba(245,166,35,0.25)'
                  : isAnswered
                  ? 'rgba(61,214,140,0.2)'
                  : 'rgba(42,52,80,0.4)',
                border: isCurrent
                  ? '2px solid #7B5EF8'
                  : isFlagged
                  ? '1px solid #F5A623'
                  : isAnswered
                  ? '1px solid rgba(61,214,140,0.4)'
                  : '1px solid var(--color-border)',
                color: isCurrent ? '#FFFFFF' : isFlagged ? '#F5A623' : isAnswered ? '#3DD68C' : 'var(--color-muted)',
                boxShadow: isCurrent ? '0 2px 10px rgba(79,142,247,0.4)' : 'none',
              }}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-[var(--color-border)] space-y-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(61,214,140,0.8)' }} />
          <span>Answered ({Object.keys(answers).length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#F5A623' }} />
          <span>Flagged ({flagged.size})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(42,52,80,0.8)' }} />
          <span>Unanswered ({total - Object.keys(answers).length})</span>
        </div>
      </div>
    </div>
  )
}

// Results Phase
const ResultsScreen = ({ questions, answers, durationMinutes, timeTaken, onRetake, onDashboard }) => {
  const total = questions.length
  let correct = 0
  let wrong = 0
  let unattempted = 0

  const subjectScores = {}

  questions.forEach((q, i) => {
    const userAns = answers[i]
    const sub = q.subject || 'General'
    if (!subjectScores[sub]) subjectScores[sub] = { correct: 0, total: 0 }
    subjectScores[sub].total++

    if (userAns === undefined) {
      unattempted++
    } else if (userAns === q.correct) {
      correct++
      subjectScores[sub].correct++
    } else {
      wrong++
    }
  })

  const scorePct = total > 0 ? Math.round((correct / total) * 100) : 0
  const passThreshold = 60
  const isPassed = scorePct >= passThreshold

  const [reviewQ, setReviewQ] = useState(0)
  const [showReview, setShowReview] = useState(false)

  const timeTakenStr = formatTime(timeTaken)

  if (showReview) {
    const q = questions[reviewQ]
    const userAnswer = answers[reviewQ]
    const isCorrect = userAnswer === q.correct
    const isAttempted = userAnswer !== undefined

    return (
      <div className="max-w-4xl mx-auto animate-fade-in space-y-5">
        {/* Review header */}
        <div className="glass-card p-5 flex items-center justify-between">
          <button
            onClick={() => setShowReview(false)}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
            style={{ background: 'rgba(42,52,80,0.5)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
          >
            <ChevronLeft size={14} /> Back to Score Summary
          </button>
          <span className="text-sm font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
            Question Review ({reviewQ + 1} of {total})
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setReviewQ(Math.max(0, reviewQ - 1))}
              disabled={reviewQ === 0}
              className="p-2 rounded-lg disabled:opacity-30"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setReviewQ(Math.min(total - 1, reviewQ + 1))}
              disabled={reviewQ === total - 1}
              className="p-2 rounded-lg disabled:opacity-30"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Review question card */}
        <div className="glass-card p-6">
          <div className="flex items-start gap-3 mb-5">
            <span className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: isAttempted ? isCorrect ? 'rgba(61,214,140,0.2)' : 'rgba(247,111,111,0.2)' : 'rgba(42,52,80,0.5)', color: isAttempted ? isCorrect ? '#3DD68C' : '#F76F6F' : 'var(--color-muted)' }}>
              {reviewQ + 1}
            </span>
            <div className="flex-1">
              <FormattedQuestionText text={q.question} />
            </div>
          </div>

          <div className="space-y-2.5 mb-5">
            {q.options.map((opt, i) => {
              const isCorrectOpt = i === q.correct
              const isUserOpt = i === userAnswer
              let bg, border, color
              if (isCorrectOpt) {
                bg = 'rgba(61,214,140,0.12)'; border = '1px solid rgba(61,214,140,0.6)'; color = '#3DD68C'
              } else if (isUserOpt && !isCorrectOpt) {
                bg = 'rgba(247,111,111,0.12)'; border = '1px solid rgba(247,111,111,0.6)'; color = '#F76F6F'
              } else {
                bg = 'rgba(26,32,53,0.4)'; border = '1px solid rgba(42,52,80,0.4)'; color = 'var(--color-muted)'
              }
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: bg, border, color }}>
                  <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(42,52,80,0.6)', color: 'inherit', fontFamily: 'Sora, sans-serif' }}>
                    {OPTION_LABELS[i]}
                  </span>
                  <span className="flex-1 text-sm">{opt}</span>
                  {isCorrectOpt && <CheckCircle size={15} style={{ color: '#3DD68C', flexShrink: 0 }} />}
                  {isUserOpt && !isCorrectOpt && <XCircle size={15} style={{ color: '#F76F6F', flexShrink: 0 }} />}
                </div>
              )
            })}
          </div>

          {/* Explanation */}
          {q.explanation && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Lightbulb size={15} style={{ color: 'var(--color-accent)' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-accent)', fontFamily: 'Sora, sans-serif' }}>
                  Explanation
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text)' }}>{q.explanation}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6 py-6">
      {/* Score Hero Card */}
      <div className="glass-card p-8 text-center relative overflow-hidden">
        <div
          className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: isPassed ? '#3DD68C' : '#F76F6F' }}
        />

        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: isPassed ? 'rgba(61,214,140,0.15)' : 'rgba(247,111,111,0.15)', border: `1px solid ${isPassed ? 'rgba(61,214,140,0.4)' : 'rgba(247,111,111,0.4)'}` }}>
          {isPassed ? <Trophy size={28} style={{ color: '#3DD68C' }} /> : <AlertTriangle size={28} style={{ color: '#F76F6F' }} />}
        </div>

        <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
          {isPassed ? 'Excellent Performance!' : 'Needs Improvement'}
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
          Full-syllabus mock test attempt summary
        </p>

        {/* Big Score Ring */}
        <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-[var(--color-border)]"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              strokeWidth="3.5"
              strokeDasharray={`${scorePct}, 100`}
              strokeLinecap="round"
              stroke={isPassed ? '#3DD68C' : scorePct >= 40 ? '#F5A623' : '#F76F6F'}
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
              {scorePct}%
            </span>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Score</span>
          </div>
        </div>

        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
          You scored {correct} out of {total} questions
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: CheckCircle, label: 'Correct', value: correct, color: '#3DD68C' },
            { icon: XCircle, label: 'Wrong', value: wrong, color: '#F76F6F' },
            { icon: Target, label: 'Skipped', value: unattempted, color: '#F5A623' },
            { icon: Clock, label: 'Time Used', value: timeTakenStr, color: '#4F8EF7' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(42,52,80,0.4)', border: '1px solid var(--color-border)' }}>
              <Icon size={16} style={{ color, margin: '0 auto 6px' }} />
              <p className="text-lg font-bold" style={{ color, fontFamily: 'Sora, sans-serif' }}>{value}</p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowReview(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.3)', color: 'var(--color-accent)' }}
        >
          <TrendingUp size={16} />
          Review Answers
        </button>
        <button
          onClick={onRetake}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: 'rgba(61,214,140,0.12)', border: '1px solid rgba(61,214,140,0.3)', color: '#3DD68C' }}
        >
          <RotateCcw size={16} />
          Retake Test
        </button>
        <button
          onClick={onDashboard}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: 'rgba(42,52,80,0.5)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
        >
          <LayoutDashboard size={16} />
          Dashboard
        </button>
      </div>
    </div>
  )
}

// ─── Main TestPage ────────────────────────────────────────────────────────────
const TestPage = () => {
  const navigate = useNavigate()
  const [phase, setPhase] = useState(PHASES.SETUP)
  const [testConfig, setTestConfig] = useState(null)    // { exam, questionCount, durationMinutes }
  const [progressInfo, setProgressInfo] = useState({ progressPct: 5, completedBatches: 0, totalBatches: 0, questionsGenerated: 0 })
  const [questions, setQuestions] = useState([])
  const [error, setError] = useState('')
  const [activeJobId, setActiveJobId] = useState(null)
  const [activeTestId, setActiveTestId] = useState(null)  // test_history UUID for result submission
  const [testHistory, setTestHistory] = useState([])      // past tests list
  const [historyReview, setHistoryReview] = useState(null) // full test detail for review
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
  const [pricingReason, setPricingReason] = useState('')

  // Test state
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})            // { index: optionIndex }
  const [flagged, setFlagged] = useState(new Set())
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [timeTaken, setTimeTaken] = useState(0)         // used on results screen
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  const timerRef = useRef(null)

  // ── Auto-restore active test session or generation job on mount ───────────
  useEffect(() => {
    try {
      // 1. Restore active test in progress
      const savedSession = sessionStorage.getItem('active_test_session')
      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        const remaining = Math.max(0, Math.floor((parsed.targetEndTime - Date.now()) / 1000))
        if (remaining > 0 && parsed.questions?.length > 0) {
          setTestConfig(parsed.testConfig)
          setQuestions(parsed.questions)
          setAnswers(parsed.answers || {})
          setFlagged(new Set(parsed.flagged || []))
          setCurrentQ(parsed.currentQ || 0)
          if (parsed.testId) setActiveTestId(parsed.testId)
          setSecondsLeft(remaining)
          setPhase(PHASES.TEST)
          return
        } else {
          sessionStorage.removeItem('active_test_session')
        }
      }

      // 2. Resume active generation job (just set the state, polling hook will handle it)
      const savedJob = sessionStorage.getItem('active_test_job')
      if (savedJob) {
        const { jobId, testConfig: config } = JSON.parse(savedJob)
        if (jobId && config) {
          setTestConfig(config)
          setActiveJobId(jobId)
          setPhase(PHASES.LOADING)
        }
      }
    } catch (e) {
      console.warn('[TestPage] Restore state error:', e)
    }
  }, [])

  // ── Dedicated lifecycle-aware polling hook ─────────────────────────────────
  useEffect(() => {
    if (phase !== PHASES.LOADING || !activeJobId) return

    let isMounted = true
    let pollCount = 0
    const MAX_POLLS = 160
    const POLL_INTERVAL = 1500
    let timeoutId = null

    const checkStatus = async () => {
      try {
        const job = await getTestJobStatus(activeJobId)
        if (!isMounted) return

        if (job.status === 'completed') {
          const normalized = (job.questions || []).map(normalizeQuestion)
          if (normalized.length === 0) throw new Error('No questions returned')

          const testId = job.testId || job.metadata?.testId || null
          if (testId) setActiveTestId(testId)

          const targetEndTime = Date.now() + (testConfig?.durationMinutes || 60) * 60 * 1000
          setQuestions(normalized)
          setAnswers({})
          setFlagged(new Set())
          setCurrentQ(0)
          setSecondsLeft((testConfig?.durationMinutes || 60) * 60)
          setPhase(PHASES.TEST)

          sessionStorage.removeItem('active_test_job')
          sessionStorage.setItem('active_test_session', JSON.stringify({
            testConfig,
            questions: normalized,
            answers: {},
            flagged: [],
            targetEndTime,
            currentQ: 0,
            testId,
          }))
          setActiveJobId(null)
          return
        }

        if (job.status === 'failed') {
          throw new Error(job.error || 'Test generation failed.')
        }

        // Update real-time questions generated along with batch progress
        setProgressInfo({
          progressPct: job.progressPct || 5,
          completedBatches: job.completedBatches || 0,
          totalBatches: job.totalBatches || 0,
          questionsGenerated: job.questionsGenerated || 0,
        })

        pollCount++
        if (pollCount >= MAX_POLLS) {
          throw new Error('Test generation timed out. Please try again.')
        }

        timeoutId = setTimeout(checkStatus, POLL_INTERVAL)
      } catch (err) {
        if (!isMounted) return
        sessionStorage.removeItem('active_test_job')
        setError(err.message || 'Failed to generate test.')
        setPhase(PHASES.SETUP)
        setActiveJobId(null)
      }
    }

    timeoutId = setTimeout(checkStatus, POLL_INTERVAL)

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [phase, activeJobId, testConfig])

  // ── Auto-save active test session to sessionStorage on state changes ───────
  useEffect(() => {
    if (phase === PHASES.TEST && questions.length > 0) {
      const targetEndTime = Date.now() + secondsLeft * 1000
      sessionStorage.setItem('active_test_session', JSON.stringify({
        testConfig,
        questions,
        answers,
        flagged: Array.from(flagged),
        targetEndTime,
        currentQ,
        testId: activeTestId,
      }))
    }
  }, [phase, questions, answers, flagged, currentQ, secondsLeft, testConfig, activeTestId])

  // ── Start test ──────────────────────────────────────────────────────────────
  const handleStart = async (exam, questionCount, durationMinutes) => {
    const config = { exam, questionCount, durationMinutes }
    setTestConfig(config)
    setProgressInfo({ progressPct: 5, completedBatches: 0, totalBatches: Math.ceil(questionCount / 10), questionsGenerated: 0 })
    setPhase(PHASES.LOADING)
    setError('')

    try {
      const data = await startTestJob({ exam, questionCount, durationMinutes })
      if (!data?.jobId) throw new Error('Failed to initiate test generation job.')

      sessionStorage.setItem('active_test_job', JSON.stringify({ jobId: data.jobId, testConfig: config }))
      setActiveJobId(data.jobId)
    } catch (err) {
      sessionStorage.removeItem('active_test_job')
      const errorMsg = err.response?.data?.error || err.message || 'Failed to generate test.'
      setError(errorMsg)
      setPhase(PHASES.SETUP)
      setActiveJobId(null)

      if (err.response?.status === 402 || err.response?.data?.code === 'PAYMENT_REQUIRED') {
        setPricingReason(errorMsg)
        setIsPricingModalOpen(true)
      }
    }
  }

  // ── Timer tick ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== PHASES.TEST) return
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current)
          handleSubmit(true) // auto-submit
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback((auto = false) => {
    clearInterval(timerRef.current)
    sessionStorage.removeItem('active_test_session')
    sessionStorage.removeItem('active_test_job')
    const elapsed = (testConfig?.durationMinutes || 0) * 60 - secondsLeft
    setTimeTaken(elapsed)
    setShowSubmitModal(false)
    setPhase(PHASES.RESULTS)

    // Persist results to backend (fire-and-forget)
    if (activeTestId) {
      submitTestResults(activeTestId, answers, elapsed).catch((err) =>
        console.warn('[TestPage] Failed to submit results:', err.message)
      )
    }
  }, [testConfig, secondsLeft, activeTestId, answers])

  // ── Answer a question ────────────────────────────────────────────────────────
  const handleAnswer = (optionIndex) => {
    setAnswers((prev) => ({ ...prev, [currentQ]: optionIndex }))
  }

  // ── Flag toggle ──────────────────────────────────────────────────────────────
  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev)
      next.has(currentQ) ? next.delete(currentQ) : next.add(currentQ)
      return next
    })
  }

  // ── Retake ───────────────────────────────────────────────────────────────────
  const handleRetake = () => {
    sessionStorage.removeItem('active_test_session')
    sessionStorage.removeItem('active_test_job')
    setPhase(PHASES.SETUP)
    setQuestions([])
    setAnswers({})
    setFlagged(new Set())
    setError('')
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  if (phase === PHASES.SETUP) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(247,111,111,0.1)', border: '1px solid rgba(247,111,111,0.3)', color: 'var(--color-red)' }}>
            <XCircle size={15} />{error}
          </div>
        )}
        <SetupScreen onStart={handleStart} />
      </div>
    )
  }

  if (phase === PHASES.LOADING) {
    return (
      <LoadingScreen
        exam={testConfig?.exam}
        questionCount={testConfig?.questionCount}
        durationMinutes={testConfig?.durationMinutes}
        progressInfo={progressInfo}
      />
    )
  }

  if (phase === PHASES.RESULTS) {
    return (
      <ResultsScreen
        questions={questions}
        answers={answers}
        durationMinutes={testConfig?.durationMinutes}
        timeTaken={timeTaken}
        onRetake={handleRetake}
        onDashboard={() => navigate('/dashboard')}
      />
    )
  }

  // ── TEST phase ───────────────────────────────────────────────────────────────
  const q = questions[currentQ]
  const isAnswered = answers[currentQ] !== undefined
  const isFlagged = flagged.has(currentQ)
  const totalSeconds = (testConfig?.durationMinutes || 60) * 60

  return (
    <div className="animate-fade-in" style={{ maxWidth: '100%' }}>
      {/* ── Top bar ── */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 mb-5 rounded-xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)', fontFamily: 'Sora, sans-serif' }}>
              Q {currentQ + 1}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>/ {questions.length}</span>
          </div>
          <div className="w-px h-4" style={{ background: 'var(--color-border)' }} />
          <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{
            background: q.difficulty === 'hard' ? 'rgba(247,111,111,0.1)' : q.difficulty === 'medium' ? 'rgba(245,166,35,0.1)' : 'rgba(61,214,140,0.1)',
            color: q.difficulty === 'hard' ? '#F76F6F' : q.difficulty === 'medium' ? '#F5A623' : '#3DD68C',
          }}>
            {q.difficulty}
          </span>
        </div>

        <Timer secondsLeft={secondsLeft} totalSeconds={totalSeconds} />

        <button
          onClick={() => setShowSubmitModal(true)}
          className="btn-primary text-xs py-2 px-4"
          style={{ background: 'linear-gradient(135deg, #F76F6F, #e05555)' }}
        >
          Submit Test
        </button>
      </div>

      {/* ── Main layout: question + nav ── */}
      <div className="flex gap-5">
        {/* Question area */}
        <div className="flex-1 min-w-0">
          <div className="glass-card p-6 mb-4">
            {/* Subject tag */}
            {(q.subject || q.topic) && (
              <div className="mb-3">
                <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(79,142,247,0.1)', color: 'var(--color-accent)', border: '1px solid rgba(79,142,247,0.2)' }}>
                  {q.subject || q.topic}
                </span>
              </div>
            )}

            {/* Question text */}
            <div className="flex items-start gap-3 mb-6">
              <span
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ background: 'rgba(79,142,247,0.15)', color: 'var(--color-accent)', fontFamily: 'Sora, sans-serif' }}
              >
                {currentQ + 1}
              </span>
              <div className="flex-1 pt-1.5">
                <FormattedQuestionText text={q.question} />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const isSelected = answers[currentQ] === i
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-150"
                    style={{
                      background: isSelected ? 'rgba(79,142,247,0.15)' : 'rgba(42,52,80,0.4)',
                      border: isSelected ? '1.5px solid rgba(79,142,247,0.6)' : '1.5px solid var(--color-border)',
                      color: isSelected ? 'var(--color-accent)' : 'var(--color-text)',
                      transform: isSelected ? 'translateX(4px)' : 'none',
                    }}
                  >
                    <span
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{
                        background: isSelected ? 'rgba(79,142,247,0.3)' : 'rgba(42,52,80,0.6)',
                        color: 'inherit',
                        fontFamily: 'Sora, sans-serif',
                      }}
                    >
                      {OPTION_LABELS[i]}
                    </span>
                    <span className="flex-1 text-sm">{opt}</span>
                    {isSelected && <CheckCircle size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Navigation row */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
              disabled={currentQ === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button
              onClick={toggleFlag}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: isFlagged ? 'rgba(245,166,35,0.15)' : 'transparent',
                border: isFlagged ? '1px solid rgba(245,166,35,0.5)' : '1px solid var(--color-border)',
                color: isFlagged ? '#F5A623' : 'var(--color-muted)',
              }}
            >
              <Flag size={14} />
              {isFlagged ? 'Flagged' : 'Flag for Review'}
            </button>

            <button
              onClick={() => setCurrentQ((c) => Math.min(questions.length - 1, c + 1))}
              disabled={currentQ === questions.length - 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30 btn-primary"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="w-52 flex-shrink-0 hidden lg:block">
          <QuestionNav
            total={questions.length}
            current={currentQ}
            answers={answers}
            flagged={flagged}
            onJump={setCurrentQ}
          />
        </div>
      </div>

      {/* ── Submit Confirmation Modal ── */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(10,14,30,0.8)', backdropFilter: 'blur(4px)' }}
        >
          <div className="glass-card p-8 max-w-md w-full mx-4 animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(247,111,111,0.15)', border: '1px solid rgba(247,111,111,0.3)' }}>
                <AlertTriangle size={24} style={{ color: '#F76F6F' }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                Submit Test?
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                You have answered <strong style={{ color: 'var(--color-accent)' }}>{Object.keys(answers).length}</strong> of <strong style={{ color: 'var(--color-text)' }}>{questions.length}</strong> questions.
                {questions.length - Object.keys(answers).length > 0 && (
                  <span style={{ color: '#F5A623' }}> {questions.length - Object.keys(answers).length} questions are still unanswered.</span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
              >
                Continue Test
              </button>
              <button
                onClick={() => handleSubmit(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #F76F6F, #e05555)' }}
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Upgrade Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        reason={pricingReason}
      />
    </div>
  )
}

export default TestPage
