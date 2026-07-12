import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Clock,
  Sparkles,
  BookOpen,
  Star,
  ChevronLeft,
  ChevronRight,
  Inbox,
  ArrowLeft,
  MessageSquare,
  BookMarked,
  CheckCircle as CheckCircleIcon,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { getHistory, getSessionDetail } from '../api/history'
import MCQCard from '../components/MCQCard'
import ScoreRing from '../components/ScoreRing'
import RubricBar from '../components/RubricBar'
import MarkdownRenderer from '../components/MarkdownRenderer'
import useBreadcrumbStore from '../store/breadcrumbStore'

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'prelims', label: 'MCQ Sessions' },
  { value: 'notes', label: 'Notes' },
  { value: 'evaluation', label: 'Evaluations' },
]

const TYPE_CONFIG = {
  prelims: {
    icon: Sparkles,
    label: 'MCQ',
    color: '#4F8EF7',
    bg: 'rgba(79,142,247,0.15)',
    border: 'rgba(79,142,247,0.3)',
  },
  notes: {
    icon: BookOpen,
    label: 'Notes',
    color: '#7B5EF8',
    bg: 'rgba(123,94,248,0.15)',
    border: 'rgba(123,94,248,0.3)',
  },
  evaluation: {
    icon: Star,
    label: 'Eval',
    color: '#F5A623',
    bg: 'rgba(245,166,35,0.15)',
    border: 'rgba(245,166,35,0.3)',
  },
}

const timeAgo = (dateStr) => {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const HistoryPage = () => {
  const location = useLocation()
  const queryTab = new URLSearchParams(location.search).get('tab')
  const defaultTab = queryTab || location.state?.activeTab || 'all'

  const [activeTab, setActiveTab] = useState(defaultTab)
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Inline session viewing states
  const [viewingSession, setViewingSession] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const setOverride = useBreadcrumbStore((s) => s.setOverride)
  const clearOverride = useBreadcrumbStore((s) => s.clearOverride)

  const fetchHistory = useCallback(async (tab, p) => {
    setLoading(true)
    setError('')
    try {
      const data = await getHistory({ page: p, type: tab })
      const list = data?.items || data?.sessions || (Array.isArray(data) ? data : [])
      setItems(list)
      setTotalPages(data?.totalPages || data?.pages || 1)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load history.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleViewSessionById = useCallback(async (id, fallbackTopic = 'Session Details') => {
    setDetailLoading(true)
    setError('')
    try {
      const data = await getSessionDetail(id)
      if (data.success && data.session) {
        setViewingSession(data.session)
        setOverride(['Dashboard', 'Study History', data.session.topic || fallbackTopic])
      } else {
        setError('Failed to retrieve session details.')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load details.')
    } finally {
      setDetailLoading(false)
    }
  }, [setOverride])

  useEffect(() => {
    fetchHistory(activeTab, page)
  }, [activeTab, page, fetchHistory])

  // Clear override and reset state on location change
  useEffect(() => {
    const viewId = location.state?.viewSessionId
    if (viewId) {
      handleViewSessionById(viewId)
    } else {
      setViewingSession(null)
      clearOverride()
    }
  }, [location, clearOverride, handleViewSessionById])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPage(1)
  }

  const handleBack = () => {
    setViewingSession(null)
    clearOverride()
    window.history.replaceState({}, document.title)
  }

  if (detailLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-accent animate-pulse" style={{ color: 'var(--color-accent)' }} />
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Retrieving study session details...
        </p>
      </div>
    )
  }

  if (viewingSession) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Back Button */}
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all hover:bg-white/5"
            style={{ color: 'var(--color-muted)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
          >
            <ArrowLeft size={14} />
            Back to Study History
          </button>
        </div>

        {/* Content Box */}
        <div className="space-y-6">
          {/* If cache expired / no content saved (pre-migration items) */}
          {viewingSession.type === 'prelims' && !viewingSession.metadata.questions && (
            <div className="glass-card py-16 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto bg-amber-500/10 text-amber-400">
                <Clock size={24} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Session Data Expired
              </p>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                This practice session was created before full database persistence was enabled, and its temporary cache has expired. Future sessions will be saved permanently.
              </p>
            </div>
          )}

          {viewingSession.type === 'notes' && !viewingSession.metadata.content && (
            <div className="glass-card py-16 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto bg-amber-500/10 text-amber-400">
                <Clock size={24} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Notes Content Expired
              </p>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                This study notes session was created before full database persistence was enabled, and its temporary cache has expired. Future notes will be saved permanently.
              </p>
            </div>
          )}

          {viewingSession.type === 'eval' && !viewingSession.metadata.evaluation && (
            <div className="glass-card py-16 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto bg-amber-500/10 text-amber-400">
                <Clock size={24} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Evaluation Expired
              </p>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                This evaluation report was created before full database persistence was enabled, and its temporary cache has expired.
              </p>
            </div>
          )}

          {/* ── PRELIMS RENDERING ── */}
          {viewingSession.type === 'prelims' && viewingSession.metadata.questions && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                  Practice Questions: {viewingSession.topic}
                </h2>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Total {viewingSession.metadata.questions.length} questions
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {viewingSession.metadata.questions.map((q, idx) => {
                  const rawOptions = q.opts || q.options || {}
                  const optionsArray = Array.isArray(rawOptions)
                    ? rawOptions
                    : ['A', 'B', 'C', 'D'].map((k) => rawOptions[k] || '')

                  const correctRaw = q.correct ?? q.ans ?? q.answer ?? q.correctAnswer ?? 'A'
                  const correctIndex = typeof correctRaw === 'string' && correctRaw.length === 1
                    ? ['A', 'B', 'C', 'D'].indexOf(correctRaw.toUpperCase())
                    : correctRaw

                  return (
                    <MCQCard
                      key={idx}
                      index={idx}
                      question={q.question || q.q}
                      options={optionsArray}
                      correctAnswer={correctIndex}
                      explanation={q.explanation || q.exp}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* ── NOTES RENDERING ── */}
          {viewingSession.type === 'notes' && viewingSession.metadata.content && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                  Notes: {viewingSession.topic}
                </h2>
              </div>
              <div className="p-5 rounded-xl border border-border" style={{ background: 'rgba(11,15,26,0.3)' }}>
                <MarkdownRenderer content={viewingSession.metadata.content} />
              </div>
            </div>
          )}

          {/* ── EVALUATION RENDERING ── */}
          {viewingSession.type === 'eval' && viewingSession.metadata.evaluation && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                  Evaluation: {viewingSession.topic}
                </h2>
              </div>

              {/* Score + Comment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="glass-card p-6 flex flex-col items-center justify-center bg-white/[0.01]">
                  <ScoreRing
                    score={viewingSession.metadata.evaluation.score || 0}
                    maxScore={viewingSession.metadata.marks || 10}
                  />
                </div>
                <div className="md:col-span-2 glass-card p-6 bg-white/[0.01]">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.15)' }}>
                      <MessageSquare size={15} style={{ color: 'var(--color-gold)' }} />
                    </div>
                    <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                      Examiner's Feedback
                    </h3>
                  </div>
                  <p
                    className="text-sm leading-relaxed italic"
                    style={{ color: 'var(--color-text)', borderLeft: '3px solid var(--color-gold)', paddingLeft: 16 }}
                  >
                    {viewingSession.metadata.evaluation.examinerComment || 'No comment available.'}
                  </p>
                </div>
              </div>

              {/* Rubric Breakdown */}
              {viewingSession.metadata.evaluation.criteria?.length > 0 && (
                <div className="glass-card p-6 bg-white/[0.01]">
                  <h3 className="text-sm font-bold mb-4" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                    Criteria Breakdown
                  </h3>
                  <div className="space-y-3">
                    {viewingSession.metadata.evaluation.criteria.map((c, i) => (
                      <RubricBar
                        key={c.name || i}
                        index={i}
                        name={c.name}
                        weight={c.weight}
                        score={c.score}
                        earned={c.earned ?? c.score ?? 0}
                        maxScore={c.maxScore ?? Math.round((c.weight / 100) * (viewingSession.metadata.marks || 10))}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* User Question & Answer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="glass-card p-5 bg-white/[0.01]">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>Question</p>
                  <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--color-text)' }}>
                    {viewingSession.metadata.question || 'N/A'}
                  </p>
                </div>
                <div className="glass-card p-5 bg-white/[0.01]">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>Your Answer</p>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-slate-300 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                    {viewingSession.metadata.answer || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {viewingSession.metadata.evaluation.strengths?.length > 0 && (
                  <div className="glass-card p-6 bg-white/[0.01]">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircleIcon size={16} style={{ color: 'var(--color-green)' }} />
                      <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>Strengths</h3>
                    </div>
                    <div className="space-y-2.5">
                      {viewingSession.metadata.evaluation.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-green-500/[0.04] border border-green-500/20">
                          <CheckCircleIcon size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-green)' }} />
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text)' }}>{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {viewingSession.metadata.evaluation.improvements?.length > 0 && (
                  <div className="glass-card p-6 bg-white/[0.01]">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle size={16} style={{ color: 'var(--color-gold)' }} />
                      <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>Areas to Improve</h3>
                    </div>
                    <div className="space-y-2.5">
                      {viewingSession.metadata.evaluation.improvements.map((s, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/[0.04] border border-amber-500/20">
                          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-gold)' }} />
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text)' }}>{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Model Answer */}
              {viewingSession.metadata.evaluation.modelAnswer && (
                <div className="glass-card p-6 bg-white/[0.01]">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(79,142,247,0.15)' }}>
                      <BookMarked size={15} style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                      Model Answer Reference
                    </h3>
                  </div>
                  <div className="p-4 rounded-xl border border-border" style={{ background: 'rgba(11,15,26,0.5)' }}>
                    <MarkdownRenderer content={viewingSession.metadata.evaluation.modelAnswer} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7A8BAA, #4F8EF7)', boxShadow: '0 4px 12px rgba(79,142,247,0.25)' }}
          >
            <Clock size={20} className="text-white" />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}
          >
            Study History
          </h1>
        </div>
        <p className="text-sm ml-14" style={{ color: 'var(--color-muted)' }}>
          Track all your MCQ sessions, generated notes, and answer evaluations
        </p>
      </div>

      {/* ── Filter Tabs ── */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', width: 'fit-content' }}
      >
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleTabChange(value)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              background:
                activeTab === value
                  ? 'linear-gradient(135deg, rgba(79,142,247,0.2), rgba(123,94,248,0.15))'
                  : 'transparent',
              border: activeTab === value ? '1px solid rgba(79,142,247,0.3)' : '1px solid transparent',
              color: activeTab === value ? 'var(--color-text)' : 'var(--color-muted)',
              fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-1">
                <div className="skeleton w-11 h-11 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 rounded" style={{ width: `${30 + i * 10}%` }} />
                  <div className="skeleton h-3 rounded" style={{ width: `${20 + i * 8}%` }} />
                </div>
                <div className="skeleton h-3 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-sm" style={{ color: 'var(--color-red)' }}>{error}</p>
            <button
              onClick={() => fetchHistory(activeTab, page)}
              className="mt-3 text-xs font-semibold underline"
              style={{ color: 'var(--color-accent)', cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center px-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(122,139,170,0.1)' }}
            >
              <Inbox size={28} style={{ color: 'var(--color-muted)' }} />
            </div>
            <p className="text-base font-semibold" style={{ color: 'var(--color-text)', fontFamily: 'Sora, sans-serif' }}>
              No {activeTab === 'all' ? 'activity' : TABS.find((t) => t.value === activeTab)?.label?.toLowerCase() || 'records'} yet
            </p>
            <p className="text-sm mt-1.5" style={{ color: 'var(--color-muted)' }}>
              {activeTab === 'all'
                ? 'Start generating MCQs, notes, or evaluating answers'
                : `Generate ${TABS.find((t) => t.value === activeTab)?.label} to see them here`}
            </p>
          </div>
        ) : (
          <>
            {items.map((item, i) => {
              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.prelims
              const Icon = cfg.icon

              return (
                <div
                  key={item._id || i}
                  onClick={() => handleViewSessionById(item.id, item.topic)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors group cursor-pointer"
                  style={{
                    borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-sm font-semibold truncate"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {item.topic || 'Unknown topic'}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontFamily: 'Sora, sans-serif' }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {item.exam || ''}
                      </span>
                      {item.score !== undefined && (
                        <span className="text-xs font-semibold" style={{ color: cfg.color }}>
                          Score: {item.score}/{item.maxScore || 10}
                        </span>
                      )}
                      {item.noteType && (
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {item.noteType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                      {timeAgo(item.createdAt || item.timestamp)}
                    </p>
                    <p className="text-xs mt-0.5 opacity-60" style={{ color: 'var(--color-muted)' }}>
                      {formatDate(item.createdAt || item.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              cursor: page <= 1 ? 'default' : 'pointer',
            }}
          >
            <ChevronLeft size={15} />
            Previous
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: page === p ? 'var(--color-accent)' : 'var(--color-card)',
                    border: page === p ? 'none' : '1px solid var(--color-border)',
                    color: page === p ? '#fff' : 'var(--color-muted)',
                    fontFamily: 'Sora, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              )
            })}
            {totalPages > 5 && (
              <span style={{ color: 'var(--color-muted)' }}>…{totalPages}</span>
            )}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              cursor: page >= totalPages ? 'default' : 'pointer',
            }}
          >
            Next
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

export default HistoryPage
