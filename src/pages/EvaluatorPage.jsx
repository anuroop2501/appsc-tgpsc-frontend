import { useState, useRef, useCallback } from 'react'
import {
  Star,
  Loader2,
  XCircle,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  BookMarked,
  Upload,
  FileText,
  Image,
  PenLine,
  Sparkles,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react'
import TopicAutocomplete from '../components/TopicAutocomplete'
import ScoreRing from '../components/ScoreRing'
import RubricBar from '../components/RubricBar'
import MarkdownRenderer from '../components/MarkdownRenderer'
import LoadingDots from '../components/LoadingDots'
import { evaluateAnswer, extractAnswerFromFile } from '../api/evaluator'
import useAuthStore from '../store/authStore'

const EXAMS = ['APPSC Group 1', 'APPSC Group 2', 'TGPSC Group 1', 'TGPSC Group 2']
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
const ACCEPTED_EXT   = '.jpg,.jpeg,.png,.webp,.pdf'
const MAX_SIZE_MB    = 10

/* ── Tiny helper: human-readable file size ───────────────────────────────── */
function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* ── Method badge text ───────────────────────────────────────────────────── */
function methodLabel(method) {
  switch (method) {
    case 'claude-vision-image': return '📷 Claude Vision (Image)'
    case 'claude-vision-pdf':   return '📄 Claude Vision (Scanned PDF)'
    case 'pdf-text-layer':      return '📃 PDF Text Layer'
    default: return method
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
const EvaluatorPage = () => {
  const user = useAuthStore((s) => s.user)

  /* ── Form state ── */
  const [form, setForm] = useState({
    question: '',
    topic: '',
    exam: user?.targetExam || EXAMS[0],
    marks: 10,
    answer: '',
  })

  /* ── Answer input mode: 'type' | 'upload' ── */
  const [answerMode, setAnswerMode] = useState('type')

  /* ── Upload state ── */
  const [uploadedFile, setUploadedFile]   = useState(null)   // File object
  const [previewUrl,   setPreviewUrl]     = useState(null)   // object-URL for images
  const [isDragging,   setIsDragging]     = useState(false)
  const [extracting,   setExtracting]     = useState(false)
  const [extractError, setExtractError]   = useState('')
  const [extractMeta,  setExtractMeta]    = useState(null)   // { method, chars }
  const [showPreview,  setShowPreview]    = useState(false)

  /* ── Evaluation state ── */
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const fileInputRef = useRef(null)
  const charLimit    = 4000
  const charCount    = form.answer.length

  /* ── Field setter ── */
  const handle = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }))
    setError('')
  }

  /* ── File validation & processing ──────────────────────────────────────── */
  const processFile = useCallback(async (file) => {
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setExtractError('Unsupported file type. Please upload JPG, PNG, WEBP, or PDF.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setExtractError(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`)
      return
    }

    setExtractError('')
    setExtractMeta(null)
    setUploadedFile(file)
    handle('answer', '')

    // Show image preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }

    // Auto-extract
    setExtracting(true)
    try {
      const data = await extractAnswerFromFile(file)
      handle('answer', data.text)
      setExtractMeta({ method: data.method, chars: data.chars })
    } catch (err) {
      setExtractError(
        err?.response?.data?.error ||
        err.message ||
        'Extraction failed. Please try again or type your answer manually.'
      )
    } finally {
      setExtracting(false)
    }
  }, []) // eslint-disable-line

  /* ── Drag-and-drop handlers ── */
  const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = ()  => setIsDragging(false)
  const onDrop      = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }
  const onFileChange = (e) => {
    const file = e.target.files[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  /* ── Clear uploaded file ── */
  const clearFile = () => {
    setUploadedFile(null)
    setPreviewUrl(null)
    setExtractMeta(null)
    setExtractError('')
    handle('answer', '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /* ── Re-extract from same file ── */
  const reExtract = () => {
    if (uploadedFile) processFile(uploadedFile)
  }

  /* ── Switch mode ── */
  const switchMode = (mode) => {
    setAnswerMode(mode)
    setError('')
    if (mode === 'type') {
      clearFile()
    }
  }

  /* ── Submit evaluation ── */
  const handleSubmit = async () => {
    if (!form.question.trim()) { setError('Please enter the question.'); return }
    if (!form.answer.trim())   { setError('Please provide your answer.'); return }
    if (form.answer.trim().length < 30) {
      setError('Answer seems too short. Write at least a few sentences.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await evaluateAnswer(form)
      setResult(data.evaluation || data)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Evaluation failed.')
    } finally {
      setLoading(false)
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F5A623, #e8930f)', boxShadow: '0 4px 12px rgba(245,166,35,0.35)' }}
          >
            <Star size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
            Answer Evaluator
          </h1>
        </div>
        <p className="text-sm ml-14" style={{ color: 'var(--color-muted)' }}>
          Get expert AI evaluation with scores, rubric breakdown, and model answers
        </p>
      </div>

      {/* ── Input Card ── */}
      <div className="glass-card p-6 space-y-5">

        {/* Question */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Question
          </label>
          <textarea
            value={form.question}
            onChange={(e) => handle('question', e.target.value)}
            rows={3}
            placeholder="Paste the question you want to evaluate…"
            className="input-field resize-none"
            style={{ lineHeight: '1.7' }}
          />
        </div>

        {/* Topic + Exam */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Topic (optional)
            </label>
            <TopicAutocomplete
              value={form.topic}
              onChange={(v) => handle('topic', v)}
              exam={form.exam}
              placeholder="Search topic…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Exam
            </label>
            <select
              value={form.exam}
              onChange={(e) => handle('exam', e.target.value)}
              className="input-field select"
            >
              {EXAMS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Marks */}
        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
            Marks
          </label>
          <div className="flex gap-3">
            {[10, 15].map((m) => (
              <button
                key={m}
                onClick={() => handle('marks', m)}
                className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
                style={{
                  background: form.marks === m
                    ? 'linear-gradient(135deg, rgba(245,166,35,0.25), rgba(245,166,35,0.15))'
                    : 'rgba(42, 52, 80, 0.4)',
                  border: form.marks === m ? '1px solid rgba(245,166,35,0.5)' : '1px solid var(--color-border)',
                  color: form.marks === m ? 'var(--color-gold)' : 'var(--color-muted)',
                  transform: form.marks === m ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                {m} Marks
              </button>
            ))}
          </div>
        </div>

        {/* ── Answer Section ─────────────────────────────────────────────── */}
        <div>
          {/* Tab bar */}
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Your Answer
            </label>
            <div
              className="flex rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <button
                onClick={() => switchMode('type')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-all duration-200"
                style={{
                  background: answerMode === 'type'
                    ? 'linear-gradient(135deg, rgba(79,142,247,0.2), rgba(79,142,247,0.1))'
                    : 'transparent',
                  color: answerMode === 'type' ? 'var(--color-accent)' : 'var(--color-muted)',
                  borderRight: '1px solid var(--color-border)',
                }}
              >
                <PenLine size={13} />
                Type
              </button>
              <button
                onClick={() => switchMode('upload')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-all duration-200"
                style={{
                  background: answerMode === 'upload'
                    ? 'linear-gradient(135deg, rgba(123,94,248,0.2), rgba(123,94,248,0.1))'
                    : 'transparent',
                  color: answerMode === 'upload' ? 'var(--color-purple)' : 'var(--color-muted)',
                }}
              >
                <Upload size={13} />
                Upload
              </button>
            </div>
          </div>

          {/* ── TYPE MODE ── */}
          {answerMode === 'type' && (
            <div className="relative">
              <textarea
                value={form.answer}
                onChange={(e) => handle('answer', e.target.value.slice(0, charLimit))}
                rows={9}
                placeholder="Write your answer here…"
                className="input-field resize-none"
                style={{ lineHeight: '1.8', fontFamily: 'DM Sans, sans-serif' }}
              />
              <span
                className="absolute bottom-3 right-3 text-xs"
                style={{ color: charCount > charLimit * 0.9 ? 'var(--color-gold)' : 'var(--color-muted)' }}
              >
                {charCount} / {charLimit}
              </span>
            </div>
          )}

          {/* ── UPLOAD MODE ── */}
          {answerMode === 'upload' && (
            <div className="space-y-4">

              {/* Drop zone */}
              {!uploadedFile && (
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative flex flex-col items-center justify-center gap-3 p-10 rounded-2xl cursor-pointer transition-all duration-200"
                  style={{
                    border: `2px dashed ${isDragging ? 'var(--color-purple)' : 'var(--color-border)'}`,
                    background: isDragging
                      ? 'rgba(123,94,248,0.07)'
                      : 'rgba(19,24,38,0.5)',
                    transform: isDragging ? 'scale(1.01)' : 'scale(1)',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background: isDragging
                        ? 'linear-gradient(135deg, rgba(123,94,248,0.3), rgba(79,142,247,0.2))'
                        : 'rgba(42,52,80,0.6)',
                    }}
                  >
                    <Upload size={24} style={{ color: isDragging ? 'var(--color-purple)' : 'var(--color-muted)' }} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                      {isDragging ? 'Drop your file here' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                      JPG, PNG, WEBP images or PDF — up to {MAX_SIZE_MB} MB
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                      Handwritten answer sheets supported via AI vision
                    </p>
                  </div>

                  {/* Supported types badges */}
                  <div className="flex gap-2 mt-1">
                    {[
                      { icon: <Image size={11} />, label: 'JPG / PNG / WEBP' },
                      { icon: <FileText size={11} />, label: 'PDF' },
                    ].map(({ icon, label }) => (
                      <span
                        key={label}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                        style={{ background: 'rgba(42,52,80,0.8)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
                      >
                        {icon} {label}
                      </span>
                    ))}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXT}
                    onChange={onFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {/* File preview card */}
              {uploadedFile && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: '1px solid var(--color-border)', background: 'rgba(19,24,38,0.7)' }}
                >
                  {/* File info bar */}
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: uploadedFile.type.startsWith('image/') ? 'rgba(123,94,248,0.15)' : 'rgba(79,142,247,0.15)' }}
                      >
                        {uploadedFile.type.startsWith('image/')
                          ? <Image size={14} style={{ color: 'var(--color-purple)' }} />
                          : <FileText size={14} style={{ color: 'var(--color-accent)' }} />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-xs" style={{ color: 'var(--color-text)' }}>
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {fmtSize(uploadedFile.size)} · {uploadedFile.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {previewUrl && (
                        <button
                          onClick={() => setShowPreview((s) => !s)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/5"
                          style={{ color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}
                        >
                          <Eye size={12} />
                          {showPreview ? 'Hide' : 'Preview'}
                        </button>
                      )}
                      <button
                        onClick={reExtract}
                        disabled={extracting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/5"
                        style={{ color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
                      >
                        <RefreshCw size={12} className={extracting ? 'animate-spin' : ''} />
                        Re-extract
                      </button>
                      <button
                        onClick={clearFile}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-all"
                        style={{ color: 'var(--color-red)', border: '1px solid rgba(247,111,111,0.2)' }}
                        title="Remove file"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Image preview */}
                  {previewUrl && showPreview && (
                    <div className="p-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <img
                        src={previewUrl}
                        alt="Uploaded answer sheet"
                        className="max-h-72 w-full object-contain rounded-xl"
                        style={{ background: 'rgba(0,0,0,0.3)' }}
                      />
                    </div>
                  )}

                  {/* Extracting state */}
                  {extracting && (
                    <div className="flex items-center gap-3 px-4 py-4">
                      <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: 'var(--color-purple)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                          Extracting text with AI vision…
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                          Claude is reading your answer sheet
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Extract success meta */}
                  {extractMeta && !extracting && (
                    <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'rgba(61,214,140,0.06)', borderBottom: '1px solid rgba(61,214,140,0.15)' }}>
                      <CheckCircle size={13} style={{ color: 'var(--color-green)' }} />
                      <span className="text-xs" style={{ color: 'var(--color-green)' }}>
                        {extractMeta.chars} characters extracted · {methodLabel(extractMeta.method)}
                      </span>
                    </div>
                  )}

                  {/* Extract error */}
                  {extractError && !extracting && (
                    <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'rgba(247,111,111,0.07)', borderBottom: '1px solid rgba(247,111,111,0.2)' }}>
                      <XCircle size={13} style={{ color: 'var(--color-red)' }} />
                      <span className="text-xs" style={{ color: 'var(--color-red)' }}>{extractError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Extracted text / editable textarea */}
              {(form.answer || extractMeta) && !extracting && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={13} style={{ color: 'var(--color-purple)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-purple)' }}>
                        Extracted Text — review and edit if needed
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: charCount > charLimit * 0.9 ? 'var(--color-gold)' : 'var(--color-muted)' }}>
                      {charCount} / {charLimit}
                    </span>
                  </div>
                  <div className="relative">
                    <textarea
                      value={form.answer}
                      onChange={(e) => handle('answer', e.target.value.slice(0, charLimit))}
                      rows={10}
                      placeholder="Extracted text will appear here…"
                      className="input-field resize-none"
                      style={{ lineHeight: '1.8', fontFamily: 'DM Sans, sans-serif' }}
                    />
                  </div>
                </div>
              )}

              {/* Upload another */}
              {uploadedFile && !extracting && (
                <button
                  onClick={() => { clearFile(); fileInputRef.current?.click() }}
                  className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl transition-all hover:bg-white/5"
                  style={{ color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
                >
                  <Upload size={12} />
                  Upload different file
                  <input ref={fileInputRef} type="file" accept={ACCEPTED_EXT} onChange={onFileChange} className="hidden" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{ background: 'rgba(247,111,111,0.1)', border: '1px solid rgba(247,111,111,0.3)', color: 'var(--color-red)' }}
          >
            <XCircle size={15} />
            {error}
          </div>
        )}

        {/* Evaluate button */}
        <button
          onClick={handleSubmit}
          disabled={loading || extracting}
          className="btn-primary w-full justify-center"
          style={{
            height: 50,
            background: 'linear-gradient(135deg, #F5A623, #e8930f)',
            boxShadow: '0 4px 15px rgba(245,166,35,0.35)',
            opacity: loading || extracting ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Evaluating…
            </>
          ) : (
            <>
              <Star size={18} />
              Evaluate Answer
            </>
          )}
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="glass-card">
          <LoadingDots message="AI examiner is reviewing your answer…" />
        </div>
      )}

      {/* ── Results ── */}
      {result && !loading && (
        <div className="space-y-5 animate-slide-up">
          {/* Score + Examiner comment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div
              className="glass-card p-6 flex flex-col items-center justify-center"
              style={{ boxShadow: '0 4px 24px rgba(245,166,35,0.2)' }}
            >
              <ScoreRing score={result.score || 0} maxScore={result.maxScore || form.marks} />
            </div>
            <div className="md:col-span-2 glass-card p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.15)' }}>
                  <MessageSquare size={15} style={{ color: 'var(--color-gold)' }} />
                </div>
                <h3 className="font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                  Examiner's Comment
                </h3>
              </div>
              <p className="text-sm leading-relaxed italic"
                style={{ color: 'var(--color-text)', borderLeft: '3px solid var(--color-gold)', paddingLeft: 16 }}>
                {result.examinerComment || 'No comment available.'}
              </p>
            </div>
          </div>

          {/* Rubric */}
          {result.criteria?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                Rubric Breakdown
              </h3>
              <div className="space-y-3">
                {result.criteria.map((c, i) => (
                  <RubricBar
                    key={c.name || i}
                    index={i}
                    name={c.name}
                    weight={c.weight}
                    score={c.score}
                    earned={c.earned ?? c.score ?? 0}
                    maxScore={c.maxScore ?? Math.round((c.weight / 100) * (result.maxScore || form.marks))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Strengths + Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {result.strengths?.length > 0 && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={16} style={{ color: 'var(--color-green)' }} />
                  <h3 className="font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>Strengths</h3>
                </div>
                <div className="space-y-2.5">
                  {result.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl"
                      style={{ background: 'rgba(61,214,140,0.07)', border: '1px solid rgba(61,214,140,0.2)' }}>
                      <CheckCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-green)' }} />
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.improvements?.length > 0 && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={16} style={{ color: 'var(--color-gold)' }} />
                  <h3 className="font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>Areas to Improve</h3>
                </div>
                <div className="space-y-2.5">
                  {result.improvements.map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl"
                      style={{ background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.2)' }}>
                      <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-gold)' }} />
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Model Answer */}
          {result.modelAnswer && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(79,142,247,0.15)' }}>
                  <BookMarked size={15} style={{ color: 'var(--color-accent)' }} />
                </div>
                <h3 className="font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                  Model Answer
                </h3>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(11,15,26,0.5)', border: '1px solid var(--color-border)' }}>
                <MarkdownRenderer content={result.modelAnswer} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EvaluatorPage
