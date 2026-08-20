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
  Loader2,
  Download,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react'
import { getHistory, getSessionDetail, regenerateSession } from '../api/history'
import { exportNotesToPdf, exportPrelimsToPdf, exportPlannerToPdf, exportPlannerToCsv } from '../lib/exportPdf'
import MCQCard from '../components/MCQCard'
import ScoreRing from '../components/ScoreRing'
import RubricBar from '../components/RubricBar'
import MarkdownRenderer from '../components/MarkdownRenderer'
import useBreadcrumbStore from '../store/breadcrumbStore'

const TABS = [
  { value: 'all', label: 'All Activity' },
  { value: 'prelims', label: 'MCQ Sessions' },
  { value: 'notes', label: 'Study Notes' },
  { value: 'evaluation', label: 'Evaluations' },
  { value: 'planner', label: 'Study Plans' },
]

const TYPE_CONFIG = {
  prelims: {
    icon: Sparkles,
    label: 'MCQ',
    color: 'var(--indigo)',
    dim: 'var(--indigo-dim)',
    border: 'var(--indigo-border)',
  },
  notes: {
    icon: BookOpen,
    label: 'Notes',
    color: 'var(--emerald)',
    dim: 'var(--emerald-dim)',
    border: 'var(--emerald-border)',
  },
  evaluation: {
    icon: Star,
    label: 'Eval',
    color: 'var(--gold-hi)',
    dim: 'var(--gold-dim)',
    border: 'var(--gold-border)',
  },
  planner: {
    icon: Calendar,
    label: 'Planner',
    color: 'var(--indigo)',
    dim: 'var(--indigo-dim)',
    border: 'var(--indigo-border)',
  },
}

/**
 * Clean and normalize messy or raw prompt topics for display.
 * E.g. strips WhatsApp chat logs ("8:29 am, 19/8/2026 Nandini: For Gupta Empire..."),
 * raw question numbers ("33.Consider the following..."), or overly long prompt text.
 */
function formatTopicTitle(topic) {
  if (!topic || typeof topic !== 'string') return 'Study Practice Session'
  let clean = topic.trim()

  // 1. Strip WhatsApp/chat transcript prefixes e.g. "8:29 am, 19/8/2026 Nandini: " or "19/08/2026, 08:29 - Name: "
  clean = clean.replace(/^(?:\d{1,2}:\d{2}\s*(?:am|pm)?,?\s*)?(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4},?\s*)?[^:\n]+:\s*/i, '')

  // 2. Strip leading numbers or bullets e.g. "33. ", "1. ", "Q1: "
  clean = clean.replace(/^(?:Q\d+[\.:\-]\s*|\d{1,3}[\.\)\-]\s*)/i, '')

  // 3. If it starts with conversational filler e.g. "For Gupta Empire, with the 4 subtopics you listed..." -> "Gupta Empire"
  const forMatch = clean.match(/^For\s+([^,\n\.]+?)(?:,|\swith|\sfor|\.|$)/i)
  if (forMatch && forMatch[1].trim().length > 2) {
    clean = forMatch[1].trim()
  }

  // 4. If it's a full question statement e.g. "Consider the following statements regarding Gupta Empire Administration: ..."
  const considerMatch = clean.match(/regarding\s+([^:\n\.]+?)(?:\sAdministration|:|\.|$)/i)
  if (considerMatch && considerMatch[1].trim().length > 2) {
    clean = `${considerMatch[1].trim()} Administration`
  }

  // 5. Cap max length nicely
  if (clean.length > 75) {
    clean = clean.slice(0, 75).replace(/[\s,\.\-]+$/, '') + '…'
  }

  return clean || topic
}

const timeAgo = (dateStr) => {
  if (!dateStr) return '—'
  const parsed = new Date(dateStr)
  if (isNaN(parsed.getTime())) return '—'
  const diff = Date.now() - parsed.getTime()
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
  
  const [viewingSession, setViewingSession] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const handleRegenerate = async () => {
    if (!viewingSession?.id) return
    setRegenerating(true)
    setError('')
    try {
      const data = await regenerateSession(viewingSession.id)
      if (data.success && data.session) {
        setViewingSession(data.session)
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to regenerate content.')
    } finally {
      setRegenerating(false)
    }
  }

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
        let session = data.session

        if (
          (session.type === 'notes' && !session.metadata?.content) ||
          (session.type === 'prelims' && !session.metadata?.questions)
        ) {
          try {
            const regenRes = await regenerateSession(id)
            if (regenRes.success && regenRes.session) {
              session = regenRes.session
            }
          } catch (e) {
            console.warn('Auto-regeneration failed, fallback to manual retry button:', e.message)
          }
        }

        setViewingSession(session)
        const cleanTitle = formatTopicTitle(session.topic || fallbackTopic)
        setOverride(['Account', 'Study History', cleanTitle])
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
      <div style={{ maxWidth: 800, margin: '80px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <Loader2 size={32} style={{ color: 'var(--indigo)', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
          Retrieving study session details...
        </p>
      </div>
    )
  }

  if (viewingSession) {
    const displayTitle = formatTopicTitle(viewingSession.topic)

    return (
      <div style={{ maxWidth: 1060, margin: '0 auto', animation: 'fadeIn 0.3s ease forwards' }}>
        {/* Back Button */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={handleBack}
            className="btn-ghost"
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            <ArrowLeft size={14} />
            Back to Study History
          </button>
        </div>

        {/* Content Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Missing data banners */}
          {viewingSession.type === 'prelims' && !viewingSession.metadata?.questions && (
            <div className="card" style={{ padding: '40px 24px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
              <Clock size={30} style={{ color: 'var(--gold-hi)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 6px' }}>
                Session Data Expired
              </p>
              <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5, margin: '0 0 20px' }}>
                This practice session was created before full database persistence was enabled. You can regenerate the questions now to save them permanently.
              </p>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="btn-primary"
              >
                {regenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={15} />}
                Regenerate Questions Now
              </button>
            </div>
          )}

          {viewingSession.type === 'notes' && !viewingSession.metadata?.content && (
            <div className="card" style={{ padding: '40px 24px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
              <Clock size={30} style={{ color: 'var(--gold-hi)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 6px' }}>
                Notes Content Expired
              </p>
              <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5, margin: '0 0 20px' }}>
                This study notes session was created before full database persistence was enabled. You can regenerate these notes now to save them permanently in your account.
              </p>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="btn-primary"
                style={{ background: 'var(--emerald)' }}
              >
                {regenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={15} />}
                Regenerate Study Notes Now
              </button>
            </div>
          )}

          {/* ── PRELIMS RENDERING ── */}
          {viewingSession.type === 'prelims' && viewingSession.metadata?.questions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 650, margin: '0 0 4px', color: 'var(--text-1)' }}>
                    Practice Questions: {displayTitle}
                  </h2>
                  <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                    Total {viewingSession.metadata.questions.length} questions · {viewingSession.exam || ''}
                  </span>
                </div>
                <button
                  onClick={() => exportPrelimsToPdf({
                    topic: displayTitle,
                    exam: viewingSession.exam,
                    questions: viewingSession.metadata.questions,
                    date: viewingSession.created_at ? new Date(viewingSession.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : undefined,
                  })}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 8, background: 'var(--indigo-dim)', color: 'var(--indigo)', border: '1px solid var(--indigo-border)', cursor: 'pointer' }}
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
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

          {/* ── NOTES & PLANNER RENDERING ── */}
          {(viewingSession.type === 'notes' || viewingSession.type === 'planner') && viewingSession.metadata?.content && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="card" style={{ padding: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span className="tag" style={{ background: viewingSession.type === 'planner' ? 'var(--indigo-dim)' : 'var(--emerald-dim)', color: viewingSession.type === 'planner' ? 'var(--indigo)' : 'var(--emerald)', border: '1px solid var(--border)' }}>
                      {viewingSession.exam || (viewingSession.type === 'planner' ? 'Study Plan' : 'Study Notes')}
                    </span>
                    <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                      {formatDate(viewingSession.created_at)}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 650, margin: 0, color: 'var(--text-1)' }}>
                    {displayTitle}
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(viewingSession.metadata.content)
                      alert('Copied to clipboard!')
                    }}
                    className="btn-ghost"
                    style={{ padding: '8px 16px', fontSize: 12.5 }}
                  >
                    Copy Content
                  </button>
                  {viewingSession.type === 'planner' && (
                    <button
                      onClick={() =>
                        exportPlannerToCsv({
                          exam: viewingSession.exam,
                          targetDays: viewingSession.metadata.targetDays || 30,
                          content: viewingSession.metadata.content,
                        })
                      }
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, padding: '8px 16px', borderRadius: 8, background: 'var(--emerald-dim)', color: 'var(--emerald)', border: '1px solid var(--emerald-border)', cursor: 'pointer' }}
                    >
                      <FileSpreadsheet size={14} />
                      Export CSV
                    </button>
                  )}
                  <button
                    onClick={() =>
                      viewingSession.type === 'planner'
                        ? exportPlannerToPdf({
                            exam: viewingSession.exam,
                            targetDays: viewingSession.metadata.targetDays || 30,
                            content: viewingSession.metadata.content,
                            date: formatDate(viewingSession.created_at),
                          })
                        : exportNotesToPdf({
                            topic: displayTitle,
                            exam: viewingSession.exam,
                            content: viewingSession.metadata.content,
                            date: formatDate(viewingSession.created_at),
                          })
                    }
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, padding: '8px 16px', borderRadius: 8, background: 'var(--emerald-dim)', color: 'var(--emerald)', border: '1px solid var(--emerald-border)', cursor: 'pointer' }}
                  >
                    <Download size={14} />
                    Download PDF
                  </button>
                </div>
              </div>

              <div className="card" style={{ padding: '28px 34px' }}>
                <div className="prose-dark">
                  <MarkdownRenderer content={viewingSession.metadata.content} />
                </div>
              </div>
            </div>
          )}

          {/* ── EVALUATION RENDERING ── */}
          {viewingSession.type === 'eval' && viewingSession.metadata?.evaluation && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 650, margin: 0, color: 'var(--text-1)' }}>
                  Evaluation: {displayTitle}
                </h2>
              </div>

              {/* Score + Comment */}
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 18 }}>
                <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ScoreRing
                    score={viewingSession.metadata.evaluation.score || 0}
                    maxScore={viewingSession.metadata.marks || 10}
                  />
                </div>
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gold-dim)', color: 'var(--gold-hi)' }}>
                      <MessageSquare size={15} />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 650, margin: 0, color: 'var(--text-1)' }}>
                      Examiner's Feedback
                    </h3>
                  </div>
                  <p style={{ fontSize: 14, fontStyle: 'italic', lineHeight: 1.65, color: 'var(--text-2)', borderLeft: '3px solid var(--gold)', paddingLeft: 16, margin: 0 }}>
                    {viewingSession.metadata.evaluation.examinerComment || 'No comment available.'}
                  </p>
                </div>
              </div>

              {/* Criteria */}
              {viewingSession.metadata.evaluation.criteria?.length > 0 && (
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 650, margin: '0 0 16px', color: 'var(--text-1)' }}>
                    Criteria Breakdown
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', animation: 'fadeIn 0.4s ease forwards' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text-1)', flexShrink: 0 }}>
            <Clock size={20} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 28, margin: 0, color: 'var(--text-1)' }}>
            Study History
          </h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 0 56px' }}>
          Track all your MCQ sessions, generated notes, and answer evaluations
        </p>
      </div>

      {/* ── Filter Tabs ── */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: 4,
          borderRadius: 12,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          width: 'fit-content',
          marginBottom: 20,
        }}
      >
        {TABS.map(({ value, label }) => {
          const isSel = activeTab === value
          return (
            <button
              key={value}
              onClick={() => handleTabChange(value)}
              style={{
                padding: '8px 16px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: isSel ? 600 : 500,
                background: isSel ? 'var(--surface-elevated)' : 'transparent',
                border: isSel ? '1px solid var(--gold-border)' : '1px solid transparent',
                color: isSel ? 'var(--gold-hi)' : 'var(--text-2)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* ── Items List ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--surface-elevated)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, width: '40%', borderRadius: 4, background: 'var(--surface-elevated)', marginBottom: 8 }} />
                  <div style={{ height: 11, width: '60%', borderRadius: 4, background: 'var(--border)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--red)', margin: '0 0 12px' }}>{error}</p>
            <button onClick={() => fetchHistory(activeTab, page)} className="btn-ghost" style={{ fontSize: 13 }}>
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '56px 20px', textAlign: 'center' }}>
            <Inbox size={34} style={{ color: 'var(--text-3)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 16, fontWeight: 650, fontFamily: 'var(--font-display)', color: 'var(--text-1)', margin: '0 0 4px' }}>
              No {activeTab === 'all' ? 'activity' : TABS.find((t) => t.value === activeTab)?.label?.toLowerCase() || 'records'} yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
              {activeTab === 'all' ? 'Start practicing MCQs or generating study notes' : `Generate ${TABS.find((t) => t.value === activeTab)?.label} to see them here`}
            </p>
          </div>
        ) : (
          <div>
            {items.map((item, i) => {
              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.prelims
              const Icon = cfg.icon
              const cleanTitle = formatTopicTitle(item.topic)

              return (
                <div
                  key={item._id || item.id || i}
                  onClick={() => handleViewSessionById(item.id, cleanTitle)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '18px 24px',
                    cursor: 'pointer',
                    borderBottom: i < items.length - 1 ? '1px solid var(--border-soft)' : 'none',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: cfg.dim,
                      color: cfg.color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cleanTitle}
                      </span>
                      <span className="tag" style={{ background: cfg.dim, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                        {item.exam || ''}
                      </span>
                      {item.score !== undefined && (
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: cfg.color }}>
                          Score: {item.score}/{item.maxScore || 10}
                        </span>
                      )}
                      {item.noteType && (
                        <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                          {item.noteType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)', margin: 0 }}>
                      {timeAgo(item.created_at || item.createdAt || item.timestamp)}
                    </p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '3px 0 0' }}>
                      {formatDate(item.created_at || item.createdAt || item.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 }}>
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1}
            className="btn-ghost"
            style={{ padding: '6px 14px', fontSize: 13, opacity: page <= 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={14} /> Previous
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1
              const isSel = page === p
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    background: isSel ? 'var(--indigo)' : 'var(--surface)',
                    border: isSel ? 'none' : '1px solid var(--border)',
                    color: isSel ? '#ffffff' : 'var(--text-2)',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
            className="btn-ghost"
            style={{ padding: '6px 14px', fontSize: 13, opacity: page >= totalPages ? 0.4 : 1 }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

export default HistoryPage
