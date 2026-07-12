import { useEffect, useState } from 'react'
import {
  X,
  Loader2,
  Sparkles,
  BookOpen,
  Star,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  BookMarked,
  ArrowRight,
} from 'lucide-react'
import { getSessionDetail } from '../api/history'
import MCQCard from './MCQCard'
import ScoreRing from './ScoreRing'
import RubricBar from './RubricBar'
import MarkdownRenderer from './MarkdownRenderer'

const SessionDetailModal = ({ isOpen, onClose, sessionId }) => {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !sessionId) return

    const loadDetail = async () => {
      setLoading(true)
      setError('')
      setSession(null)
      try {
        const data = await getSessionDetail(sessionId)
        if (data.success && data.session) {
          setSession(data.session)
        } else {
          setError('Could not retrieve session details.')
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load details.')
      } finally {
        setLoading(false)
      }
    }

    loadDetail()
  }, [isOpen, sessionId])

  if (!isOpen) return null

  // Helper to format date
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

  // Type configuration
  const TYPE_META = {
    prelims: { label: 'MCQ Practice', color: '#4F8EF7', icon: Sparkles },
    notes: { label: 'Mains Notes', color: '#7B5EF8', icon: BookOpen },
    eval: { label: 'Answer Evaluation', color: '#F5A623', icon: Star },
  }

  const meta = session ? (TYPE_META[session.type] || TYPE_META.prelims) : TYPE_META.prelims
  const Icon = meta.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden z-10 flex flex-col animate-scale-up"
        style={{
          background: 'rgba(19, 24, 38, 0.98)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: `${meta.color}15` }}
            >
              <Icon size={16} style={{ color: meta.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className="text-base font-bold"
                  style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}
                >
                  {session ? session.topic : 'Study Session Details'}
                </h2>
                {session && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                    style={{ background: `${meta.color}15`, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                )}
              </div>
              {session && (
                <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--color-muted)' }}>
                  <span>{session.exam}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {formatDate(session.created_at)}
                  </span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
            style={{ color: 'var(--color-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin" style={{ color: meta.color }} />
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Retrieving your study history session...
              </p>
            </div>
          )}

          {error && (
            <div className="py-12 flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-red-500/10 text-red-400">
                <AlertTriangle size={24} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Unable to Load Content
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
                {error}
              </p>
            </div>
          )}

          {!loading && !error && session && (
            <>
              {/* If cache expired / no content saved (pre-migration items) */}
              {session.type === 'prelims' && !session.metadata.questions && (
                <div className="py-12 text-center max-w-md mx-auto">
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

              {session.type === 'notes' && !session.metadata.content && (
                <div className="py-12 text-center max-w-md mx-auto">
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

              {session.type === 'eval' && !session.metadata.evaluation && (
                <div className="py-12 text-center max-w-md mx-auto">
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
              {session.type === 'prelims' && session.metadata.questions && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      Practice Questions
                    </p>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Total {session.metadata.questions.length} questions
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {session.metadata.questions.map((q, idx) => {
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
              {session.type === 'notes' && session.metadata.content && (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl border border-border" style={{ background: 'rgba(11,15,26,0.3)' }}>
                    <MarkdownRenderer content={session.metadata.content} />
                  </div>
                </div>
              )}

              {/* ── EVALUATION RENDERING ── */}
              {session.type === 'eval' && session.metadata.evaluation && (
                <div className="space-y-6">
                  {/* Score + Comment */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="glass-card p-6 flex flex-col items-center justify-center bg-white/[0.01]">
                      <ScoreRing
                        score={session.metadata.evaluation.score || 0}
                        maxScore={session.metadata.marks || 10}
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
                        {session.metadata.evaluation.examinerComment || 'No comment available.'}
                      </p>
                    </div>
                  </div>

                  {/* Rubric Breakdown */}
                  {session.metadata.evaluation.criteria?.length > 0 && (
                    <div className="glass-card p-6 bg-white/[0.01]">
                      <h3 className="text-sm font-bold mb-4" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                        Criteria Breakdown
                      </h3>
                      <div className="space-y-3">
                        {session.metadata.evaluation.criteria.map((c, i) => (
                          <RubricBar
                            key={c.name || i}
                            index={i}
                            name={c.name}
                            weight={c.weight}
                            score={c.score}
                            earned={c.earned ?? c.score ?? 0}
                            maxScore={c.maxScore ?? Math.round((c.weight / 100) * (session.metadata.marks || 10))}
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
                        {session.metadata.question || 'N/A'}
                      </p>
                    </div>
                    <div className="glass-card p-5 bg-white/[0.01]">
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>Your Answer</p>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-slate-300 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                        {session.metadata.answer || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {session.metadata.evaluation.strengths?.length > 0 && (
                      <div className="glass-card p-6 bg-white/[0.01]">
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle size={16} style={{ color: 'var(--color-green)' }} />
                          <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>Strengths</h3>
                        </div>
                        <div className="space-y-2.5">
                          {session.metadata.evaluation.strengths.map((s, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-green-500/[0.04] border border-green-500/20">
                              <CheckCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-green)' }} />
                              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text)' }}>{s}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {session.metadata.evaluation.improvements?.length > 0 && (
                      <div className="glass-card p-6 bg-white/[0.01]">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle size={16} style={{ color: 'var(--color-gold)' }} />
                          <h3 className="font-bold text-sm" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>Areas to Improve</h3>
                        </div>
                        <div className="space-y-2.5">
                          {session.metadata.evaluation.improvements.map((s, i) => (
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
                  {session.metadata.evaluation.modelAnswer && (
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
                        <MarkdownRenderer content={session.metadata.evaluation.modelAnswer} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SessionDetailModal
