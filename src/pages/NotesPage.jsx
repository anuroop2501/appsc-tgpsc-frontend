import { useState, useRef, useCallback, useEffect } from 'react'
import {
  BookOpen,
  Loader2,
  Copy,
  CheckCheck,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import TopicAutocomplete from '../components/TopicAutocomplete'
import MarkdownRenderer from '../components/MarkdownRenderer'
import LoadingDots from '../components/LoadingDots'
import PricingModal from '../components/PricingModal'
import { streamNotes } from '../api/notes'
import { getUserBalance } from '../api/payment'
import useAuthStore from '../store/authStore'
import { useLanguage } from '../context/LanguageContext'

const EXAMS = ['APPSC Group 1', 'APPSC Group 2']

const NotesPage = () => {
  const user = useAuthStore((s) => s.user)
  const { language, t } = useLanguage()

  const NOTE_TYPES = [
    { value: 'Comprehensive', label: t('notes.comprehensive', 'Comprehensive'), icon: '📚' },
    { value: 'Quick Revision', label: t('notes.quickRevision', 'Quick Revision'), icon: '⚡' },
    { value: 'Facts & Figures', label: t('notes.factsAndFigures', 'Facts & Figures'), icon: '📊' },
    { value: 'Current Affairs', label: t('notes.currentAffairs', 'Current Affairs'), icon: '🗞️' },
  ]

  const [topic, setTopic] = useState('')
  const [exam, setExam] = useState(user?.targetExam || EXAMS[0])
  const [noteType, setNoteType] = useState('Comprehensive')
  const [content, setContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const setAuthCredits = useAuthStore((s) => s.setCredits)
  const credits = user?.credits !== undefined ? user.credits : 100
  const [isPricingOpen, setIsPricingOpen] = useState(false)

  const abortRef = useRef(null)
  const contentRef = useRef('')

  useEffect(() => {
    if (user?.id || user?.userId) {
      getUserBalance()
        .then((data) => {
          if (data.credits !== undefined && setAuthCredits) setAuthCredits(data.credits)
        })
        .catch(() => {})
    }
  }, [user?.id, user?.userId, setAuthCredits])

  const handleGenerate = useCallback(async () => {
    if (credits < 10) {
      setError(t('common.insufficientCredits', 'Insufficient credits (10 required). Please recharge or upgrade.'))
      setIsPricingOpen(true)
      return
    }

    if (!topic.trim()) {
      setError(t('common.topicPlaceholder', 'Please enter or select a topic.'))
      return
    }

    if (abortRef.current) {
      abortRef.current()
      abortRef.current = null
    }

    setContent('')
    contentRef.current = ''
    setError('')
    setIsDone(false)
    setIsStreaming(true)

    const abort = await streamNotes(
      { topic, exam, noteType, language },
      (chunk) => {
        contentRef.current += chunk
        setContent(contentRef.current)
      },
      () => {
        setIsStreaming(false)
        setIsDone(true)
        abortRef.current = null
        setCredits((prev) => Math.max(0, prev - 10))
      },
      (err) => {
        setIsStreaming(false)
        if (err?.message?.includes('402') || err?.statusCode === 402) {
          setIsPricingOpen(true)
        }
        setError(err.message || t('common.error', 'Streaming failed. Please try again.'))
        abortRef.current = null
      }
    )

    if (typeof abort === 'function') {
      abortRef.current = abort
    }
  }, [topic, exam, noteType, language, credits, t])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* ignore */
    }
  }

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current()
      abortRef.current = null
      setIsStreaming(false)
      setIsDone(true)
    }
  }

  const isGroup2 = (user?.targetExam || '').toLowerCase().includes('group 2')

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', animation: 'fadeIn 0.4s ease forwards' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--emerald-dim)', color: 'var(--emerald)', flexShrink: 0 }}>
            <BookOpen size={20} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 560, fontSize: 28, margin: 0, color: 'var(--text-1)' }}>
            {isGroup2 ? t('nav.group2Notes', 'Notes') : t('nav.mainsNotes', 'Notes')}
          </h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 0 56px', lineHeight: 1.5 }}>
          {t('notes.subtitle', 'Structured study notes tailored to your APPSC exam pattern')}
        </p>
      </div>

      {/* ── Input Card ── */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 22 }}>
          {/* Topic */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              {t('common.topicOrSyllabus', 'Topic / Syllabus Area')}
            </label>
            <TopicAutocomplete
              value={topic}
              onChange={setTopic}
              exam={exam}
              placeholder={t('common.topicPlaceholder', 'e.g. Panchayati Raj System, Rivers of Andhra Pradesh, Judicial Review…')}
            />
          </div>

          {/* Exam */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              {t('common.targetExam', 'Target Exam')}
            </label>
            <select value={exam} onChange={(e) => setExam(e.target.value)} className="input" style={{ height: 46 }}>
              {EXAMS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Note Type */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              {t('notes.noteStyle', 'Note Format & Style')}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {NOTE_TYPES.map(({ value, label, icon }) => {
                const isSel = noteType === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNoteType(value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      borderRadius: 10,
                      fontSize: 13.5,
                      fontWeight: isSel ? 600 : 500,
                      background: isSel ? 'var(--emerald-dim)' : 'var(--surface-elevated)',
                      border: isSel ? '1px solid var(--emerald-border)' : '1px solid var(--border)',
                      color: isSel ? 'var(--emerald)' : 'var(--text-2)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleGenerate}
            disabled={isStreaming}
            style={{
              flex: 1,
              height: 46,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 11,
              background: 'var(--emerald)',
              color: '#ffffff',
              fontSize: 14.5,
              fontWeight: 600,
              border: 'none',
              cursor: isStreaming ? 'not-allowed' : 'pointer',
              opacity: isStreaming ? 0.7 : 1,
              transition: 'opacity 0.15s ease',
            }}
          >
            {isStreaming ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                {t('notes.generating', 'Generating Notes…')}
              </>
            ) : (
              <>
                <BookOpen size={17} />
                {t('notes.generateBtn', 'Generate Notes (10 Credits)')}
              </>
            )}
          </button>

          {isStreaming && (
            <button
              onClick={handleStop}
              className="btn-ghost"
              style={{ padding: '0 24px', height: 46 }}
            >
              {t('notes.stopGenerating', 'Stop')}
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 10, marginTop: 16, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 13.5 }}>
            <XCircle size={15} /> {error}
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {isStreaming && !content && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <LoadingDots message={t('notes.streamingMessage', 'Preparing structured study notes tailored to APPSC syllabus…')} />
        </div>
      )}

      {/* ── Output Card ── */}
      {content && (
        <div
          className="card"
          style={{
            borderLeft: '3px solid var(--emerald)',
            overflow: 'hidden',
            animation: 'fadeIn 0.3s ease forwards',
          }}
        >
          {/* Output header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-soft)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 560, margin: 0, color: 'var(--text-1)' }}>
                {topic}
              </h3>
              {isStreaming && (
                <span className="tag" style={{ background: 'var(--indigo-dim)', color: 'var(--indigo)' }}>
                  Live
                </span>
              )}
              {isDone && !isStreaming && (
                <span className="tag" style={{ background: 'var(--emerald-dim)', color: 'var(--emerald)' }}>
                  <CheckCheck size={11} style={{ marginRight: 3 }} /> Complete
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isDone && (
                <button
                  onClick={handleGenerate}
                  className="btn-ghost"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  title={t('common.tryAgain', 'Regenerate')}
                >
                  <RefreshCw size={13} />
                </button>
              )}
              <button
                onClick={handleCopy}
                disabled={!content}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: copied ? 'var(--emerald-dim)' : 'var(--surface-elevated)',
                  border: copied ? '1px solid var(--emerald-border)' : '1px solid var(--border)',
                  color: copied ? 'var(--emerald)' : 'var(--text-1)',
                  cursor: 'pointer',
                }}
              >
                {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
                {copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy')}
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '24px 28px' }} className="prose-dark">
            <MarkdownRenderer content={content} />
          </div>

          {/* Tags */}
          {isDone && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 24px',
                borderTop: '1px solid var(--border-soft)',
                background: 'var(--bg-soft)',
                fontSize: 12,
                color: 'var(--text-3)',
              }}
            >
              <span className="tag" style={{ background: 'var(--surface-elevated)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                {exam}
              </span>
              <span className="tag" style={{ background: 'var(--surface-elevated)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                {noteType}
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                {content.split(/\s+/).length} words
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Pricing & Recharge Modal ── */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        onPaymentSuccess={(updatedUser) => {
          if (updatedUser?.credits !== undefined) setCredits(updatedUser.credits)
          setIsPricingOpen(false)
        }}
        reason="Generating syllabus study notes requires 10 credits."
      />
    </div>
  )
}

export default NotesPage
