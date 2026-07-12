import { useState, useRef, useCallback } from 'react'
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
import { streamNotes } from '../api/notes'
import useAuthStore from '../store/authStore'

const EXAMS = ['APPSC Group 1', 'APPSC Group 2', 'TGPSC Group 1', 'TGPSC Group 2']

const NOTE_TYPES = [
  { value: 'Comprehensive', label: 'Comprehensive', icon: '📚' },
  { value: 'Quick Revision', label: 'Quick Revision', icon: '⚡' },
  { value: 'Facts & Figures', label: 'Facts & Figures', icon: '📊' },
  { value: 'Current Affairs', label: 'Current Affairs', icon: '🗞️' },
]

const NotesPage = () => {
  const user = useAuthStore((s) => s.user)

  const [topic, setTopic] = useState('')
  const [exam, setExam] = useState(user?.targetExam || EXAMS[0])
  const [noteType, setNoteType] = useState('Comprehensive')
  const [content, setContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const abortRef = useRef(null)
  const contentRef = useRef('')

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter or select a topic.')
      return
    }

    // Abort any existing stream
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
      { topic, exam, noteType },
      (chunk) => {
        contentRef.current += chunk
        setContent(contentRef.current)
      },
      () => {
        setIsStreaming(false)
        setIsDone(true)
        abortRef.current = null
      },
      (err) => {
        setIsStreaming(false)
        setError(err.message || 'Streaming failed. Please try again.')
        abortRef.current = null
      }
    )

    if (typeof abort === 'function') {
      abortRef.current = abort
    }
  }, [topic, exam, noteType])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* clipboard error — silently ignore */
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7B5EF8, #6a48e0)', boxShadow: '0 4px 12px rgba(123,94,248,0.35)' }}
          >
            <BookOpen size={20} className="text-white" />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}
          >
            Mains Notes Generator
          </h1>
        </div>
        <p className="text-sm ml-14" style={{ color: 'var(--color-muted)' }}>
          AI-structured study notes tailored to your APPSC/TGPSC exam pattern
        </p>
      </div>

      {/* ── Input Card ── */}
      <div className="glass-card p-6 space-y-5">
        {/* Topic */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Topic
          </label>
          <TopicAutocomplete
            value={topic}
            onChange={setTopic}
            exam={exam}
            placeholder="e.g. Panchayati Raj System, Rivers of Telangana…"
          />
        </div>

        {/* Exam */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Exam
          </label>
          <select
            value={exam}
            onChange={(e) => setExam(e.target.value)}
            className="input-field select"
          >
            {EXAMS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* Note Type */}
        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
            Note Type
          </label>
          <div className="flex flex-wrap gap-2.5">
            {NOTE_TYPES.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setNoteType(value)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background:
                    noteType === value
                      ? 'linear-gradient(135deg, rgba(123,94,248,0.25), rgba(79,142,247,0.2))'
                      : 'rgba(42, 52, 80, 0.4)',
                  border:
                    noteType === value
                      ? '1px solid rgba(123,94,248,0.5)'
                      : '1px solid var(--color-border)',
                  color: noteType === value ? 'var(--color-text)' : 'var(--color-muted)',
                  transform: noteType === value ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate / Stop */}
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={isStreaming}
            className="btn-primary flex-1 justify-center"
            style={{ height: 48, background: 'linear-gradient(135deg, #7B5EF8, #4F8EF7)' }}
          >
            {isStreaming ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <BookOpen size={17} />
                Generate Notes
              </>
            )}
          </button>

          {isStreaming && (
            <button
              onClick={handleStop}
              className="px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-white/10"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
            >
              Stop
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{ background: 'rgba(247,111,111,0.1)', border: '1px solid rgba(247,111,111,0.3)', color: 'var(--color-red)' }}
          >
            <XCircle size={15} />
            {error}
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {isStreaming && !content && (
        <div className="glass-card">
          <LoadingDots message="AI is generating your notes…" />
        </div>
      )}

      {/* ── Output Card ── */}
      {content && (
        <div className="glass-card overflow-hidden animate-slide-up">
          {/* Output header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-3">
              <h3
                className="font-semibold"
                style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}
              >
                {topic}
              </h3>
              {isStreaming && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(79,142,247,0.15)', color: 'var(--color-accent)' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--color-accent)', animation: 'pulseDot 1s infinite' }}
                  />
                  Live
                </span>
              )}
              {isDone && !isStreaming && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(61,214,140,0.15)', color: 'var(--color-green)' }}
                >
                  <CheckCheck size={11} />
                  Complete
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isDone && (
                <button
                  onClick={handleGenerate}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--color-muted)' }}
                  title="Regenerate"
                >
                  <RefreshCw size={15} />
                </button>
              )}
              <button
                onClick={handleCopy}
                disabled={!content}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: copied ? 'rgba(61,214,140,0.15)' : 'rgba(79,142,247,0.12)',
                  border: copied ? '1px solid rgba(61,214,140,0.4)' : '1px solid rgba(79,142,247,0.3)',
                  color: copied ? 'var(--color-green)' : 'var(--color-accent)',
                }}
              >
                {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <MarkdownRenderer content={content} />

            {/* Blinking cursor if streaming */}
            {isStreaming && (
              <span
                className="inline-block w-0.5 h-4 ml-0.5 rounded-sm"
                style={{
                  background: 'var(--color-accent)',
                  animation: 'pulseDot 1s infinite',
                  verticalAlign: 'text-bottom',
                }}
              />
            )}
          </div>

          {/* Tags */}
          {isDone && (
            <div
              className="flex items-center gap-2 px-6 py-4 border-t flex-wrap"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: 'rgba(123,94,248,0.15)', color: '#7B5EF8', border: '1px solid rgba(123,94,248,0.3)' }}
              >
                {exam}
              </span>
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: 'rgba(79,142,247,0.12)', color: 'var(--color-accent)', border: '1px solid rgba(79,142,247,0.25)' }}
              >
                {noteType}
              </span>
              <span className="text-xs ml-auto" style={{ color: 'var(--color-muted)' }}>
                {content.split(' ').length} words
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotesPage
