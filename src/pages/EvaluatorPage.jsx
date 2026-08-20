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

const EXAMS = ['APPSC Group 1', 'APPSC Group 2']
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
const ACCEPTED_EXT   = '.jpg,.jpeg,.png,.webp,.pdf'
const MAX_SIZE_MB    = 10

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function methodLabel(method) {
  switch (method) {
    case 'claude-vision-image': return '📷 Claude Vision (Image)'
    case 'claude-vision-pdf':   return '📄 Claude Vision (Scanned PDF)'
    case 'pdf-text-layer':      return '📃 PDF Text Layer'
    default: return method
  }
}

const EvaluatorPage = () => {
  const user = useAuthStore((s) => s.user)

  const [form, setForm] = useState({
    question: '',
    topic: '',
    exam: user?.targetExam || EXAMS[0],
    marks: 10,
    answer: '',
  })

  const [answerMode, setAnswerMode] = useState('type')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [extractMeta, setExtractMeta] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fileInputRef = useRef(null)
  const charLimit = 4000
  const charCount = form.answer.length

  const handle = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }))
    setError('')
  }

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

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }

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
  }, [])

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

  const clearFile = () => {
    setUploadedFile(null)
    setPreviewUrl(null)
    setExtractMeta(null)
    setExtractError('')
    handle('answer', '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const reExtract = () => {
    if (uploadedFile) processFile(uploadedFile)
  }

  const switchMode = (mode) => {
    setAnswerMode(mode)
    setError('')
    if (mode === 'type') {
      clearFile()
    }
  }

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

  return (
    <div style={{ maxWidth: 1000, animation: 'fadeIn 0.4s ease forwards' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gold-dim)', color: 'var(--gold-hi)', flexShrink: 0 }}>
            <Star size={20} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 560, fontSize: 28, margin: 0, color: 'var(--text-1)' }}>
            Answer Evaluator
          </h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 0 56px', lineHeight: 1.5 }}>
          Get expert AI evaluation with scores, rubric breakdown, and benchmark model answers
        </p>
      </div>

      {/* ── Input Card ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 20 }}>

          {/* Question */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>
              Question
            </label>
            <textarea
              value={form.question}
              onChange={(e) => handle('question', e.target.value)}
              rows={3}
              placeholder="Paste the Mains question you want to evaluate…"
              className="input"
              style={{ minHeight: 80, lineHeight: 1.6 }}
            />
          </div>

          {/* Topic + Exam */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>
                Exam
              </label>
              <select
                value={form.exam}
                onChange={(e) => handle('exam', e.target.value)}
                className="input select"
              >
                {EXAMS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Marks */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>
              Marks
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[10, 15].map((m) => {
                const isSel = form.marks === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handle('marks', m)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      background: isSel ? 'var(--gold-dim)' : 'var(--surface-elevated)',
                      border: isSel ? '1px solid var(--gold-border)' : '1px solid var(--border)',
                      color: isSel ? 'var(--gold-hi)' : 'var(--text-2)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {m} Marks
                  </button>
                )
              })}
            </div>
          </div>

          {/* Answer Mode + Input */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>
                Your Answer
              </label>
              <div style={{ display: 'flex', borderRadius: 8, background: 'var(--surface-elevated)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => switchMode('type')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    border: 'none',
                    background: answerMode === 'type' ? 'var(--surface)' : 'transparent',
                    color: answerMode === 'type' ? 'var(--text-1)' : 'var(--text-3)',
                    cursor: 'pointer',
                  }}
                >
                  <PenLine size={13} /> Type
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('upload')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    border: 'none',
                    background: answerMode === 'upload' ? 'var(--surface)' : 'transparent',
                    color: answerMode === 'upload' ? 'var(--text-1)' : 'var(--text-3)',
                    cursor: 'pointer',
                  }}
                >
                  <Upload size={13} /> Upload (OCR)
                </button>
              </div>
            </div>

            {/* TYPE MODE */}
            {answerMode === 'type' && (
              <div style={{ position: 'relative' }}>
                <textarea
                  value={form.answer}
                  onChange={(e) => handle('answer', e.target.value.slice(0, charLimit))}
                  rows={8}
                  placeholder="Type or paste your written answer here…"
                  className="input"
                  style={{ minHeight: 180, lineHeight: 1.6, paddingBottom: 28 }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 12,
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: charCount > charLimit * 0.9 ? 'var(--gold-hi)' : 'var(--text-3)',
                  }}
                >
                  {charCount} / {charLimit}
                </span>
              </div>
            )}

            {/* UPLOAD MODE */}
            {answerMode === 'upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {!uploadedFile && (
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      padding: 36,
                      borderRadius: 14,
                      cursor: 'pointer',
                      border: `2px dashed ${isDragging ? 'var(--indigo)' : 'var(--border)'}`,
                      background: isDragging ? 'var(--indigo-dim)' : 'var(--surface-elevated)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', color: 'var(--indigo)' }}>
                      <Upload size={22} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 4px' }}>
                        {isDragging ? 'Drop your file here' : 'Drag & drop or click to upload answer sheet'}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                        JPG, PNG, WEBP or PDF up to {MAX_SIZE_MB} MB · Handwriting supported
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_EXT}
                      onChange={onFileChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}

                {/* Uploaded File Bar */}
                {uploadedFile && (
                  <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--indigo-dim)', color: 'var(--indigo)' }}>
                          {uploadedFile.type.startsWith('image/') ? <Image size={15} /> : <FileText size={15} />}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>{uploadedFile.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>{fmtSize(uploadedFile.size)}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {previewUrl && (
                          <button
                            type="button"
                            onClick={() => setShowPreview((s) => !s)}
                            className="btn-ghost"
                            style={{ padding: '4px 10px', fontSize: 11.5 }}
                          >
                            <Eye size={12} /> {showPreview ? 'Hide' : 'Preview'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={reExtract}
                          disabled={extracting}
                          className="btn-ghost"
                          style={{ padding: '4px 10px', fontSize: 11.5 }}
                        >
                          <RefreshCw size={12} className={extracting ? 'animate-spin-slow' : ''} /> Re-extract
                        </button>
                        <button
                          type="button"
                          onClick={clearFile}
                          style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--red-dim)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>

                    {previewUrl && showPreview && (
                      <div style={{ padding: 12, borderTop: '1px solid var(--border-soft)' }}>
                        <img src={previewUrl} alt="Preview" style={{ maxHeight: 240, width: '100%', objectFit: 'contain', borderRadius: 8 }} />
                      </div>
                    )}

                    {extracting && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--indigo-dim)' }}>
                        <Loader2 size={15} style={{ color: 'var(--indigo)', animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: 12, color: 'var(--indigo)' }}>Reading handwriting with AI vision…</span>
                      </div>
                    )}

                    {extractMeta && !extracting && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--emerald-dim)', fontSize: 12, color: 'var(--emerald)' }}>
                        <CheckCircle size={13} />
                        <span>{extractMeta.chars} characters extracted ({methodLabel(extractMeta.method)})</span>
                      </div>
                    )}

                    {extractError && !extracting && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--red-dim)', fontSize: 12, color: 'var(--red)' }}>
                        <XCircle size={13} />
                        <span>{extractError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Extracted Text */}
                {(form.answer || extractMeta) && !extracting && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-3)', marginBottom: 6 }}>
                      Extracted Text (edit if needed):
                    </label>
                    <textarea
                      value={form.answer}
                      onChange={(e) => handle('answer', e.target.value.slice(0, charLimit))}
                      rows={8}
                      className="input"
                      style={{ minHeight: 160, lineHeight: 1.6 }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 13.5 }}>
            <XCircle size={15} /> {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || extracting}
          style={{
            width: '100%',
            height: 46,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: 11,
            background: 'linear-gradient(155deg, var(--gold-hi), var(--gold) 60%, #8a6e1c)',
            color: '#0A0F1C',
            fontSize: 14.5,
            fontWeight: 650,
            border: 'none',
            cursor: loading || extracting ? 'not-allowed' : 'pointer',
            opacity: loading || extracting ? 0.6 : 1,
            transition: 'opacity 0.15s ease',
          }}
        >
          {loading ? (
            <>
              <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
              Evaluating Answer…
            </>
          ) : (
            <>
              <Star size={17} />
              Evaluate Answer
            </>
          )}
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <LoadingDots message="Evaluating your answer against APPSC topper benchmarks…" />
        </div>
      )}

      {/* ── Results ── */}
      {result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease forwards' }}>
          {/* Score + Comment */}
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ScoreRing score={result.score || 0} maxScore={result.maxScore || form.marks} />
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gold-dim)', color: 'var(--gold-hi)' }}>
                  <MessageSquare size={14} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 560, margin: 0, color: 'var(--text-1)' }}>
                  Examiner's Feedback
                </h3>
              </div>
              <p style={{ fontSize: 13.5, fontStyle: 'italic', lineHeight: 1.6, color: 'var(--text-2)', borderLeft: '3px solid var(--gold)', paddingLeft: 14, margin: 0 }}>
                {result.examinerComment || 'No comment available.'}
              </p>
            </div>
          </div>

          {/* Rubric Breakdown */}
          {result.criteria?.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 560, margin: '0 0 16px', color: 'var(--text-1)' }}>
                Rubric Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

          {/* Strengths + Areas to Improve */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {result.strengths?.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <CheckCircle size={15} style={{ color: 'var(--emerald)' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 560, margin: 0, color: 'var(--text-1)' }}>Strengths</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.strengths.map((s, i) => (
                    <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--emerald-dim)', border: '1px solid var(--emerald-border)', fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.improvements?.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <AlertTriangle size={15} style={{ color: 'var(--gold-hi)' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 560, margin: 0, color: 'var(--text-1)' }}>Areas to Improve</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.improvements.map((s, i) => (
                    <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Model Answer */}
          {result.modelAnswer && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--indigo-dim)', color: 'var(--indigo)' }}>
                  <BookMarked size={14} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 560, margin: 0, color: 'var(--text-1)' }}>
                  Model Answer Reference
                </h3>
              </div>
              <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px' }} className="prose-dark">
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
