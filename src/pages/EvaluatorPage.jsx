import { useState, useRef, useCallback, useEffect } from 'react'
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
  RefreshCw,
  Eye,
  X,
  Lock,
} from 'lucide-react'
import TopicAutocomplete from '../components/TopicAutocomplete'
import ScoreRing from '../components/ScoreRing'
import RubricBar from '../components/RubricBar'
import MarkdownRenderer from '../components/MarkdownRenderer'
import LoadingDots from '../components/LoadingDots'
import PricingModal from '../components/PricingModal'
import { evaluateAnswer, extractAnswerFromFile } from '../api/evaluator'
import { getUserBalance } from '../api/payment'
import useAuthStore from '../store/authStore'
import { useLanguage } from '../context/LanguageContext'

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
  const { language, t } = useLanguage()

  const userPlan = (user?.planTier || user?.plan_tier || 'free').toLowerCase()
  const isEvalLocked = !['pro_999', 'officer_1999', 'admin'].includes(userPlan)

  const setAuthCredits = useAuthStore((s) => s.setCredits)
  const credits = user?.credits !== undefined ? user.credits : 100
  const [isPricingOpen, setIsPricingOpen] = useState(false)

  useEffect(() => {
    if (user?.id || user?.userId) {
      getUserBalance()
        .then((data) => {
          if (data.credits !== undefined && setAuthCredits) setAuthCredits(data.credits)
        })
        .catch(() => {})
    }
  }, [user?.id, user?.userId, setAuthCredits])

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
      if (err.response?.status === 403) {
        setIsPricingOpen(true)
      }
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
    if (isEvalLocked) {
      setIsPricingOpen(true)
      return
    }

    if (credits < 20) {
      setError(t('common.insufficientCredits', 'Insufficient credits (20 required). Please recharge or upgrade.'))
      setIsPricingOpen(true)
      return
    }

    if (!form.question.trim()) { setError(t('evaluator.questionPlaceholder', 'Please enter the question.')); return }
    if (!form.answer.trim())   { setError(t('evaluator.answerPlaceholder', 'Please provide your answer.')); return }
    if (form.answer.trim().length < 30) {
      setError(t('evaluator.answerPlaceholder', 'Answer seems too short. Write at least a few sentences.'))
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await evaluateAnswer({ ...form, language })
      setResult(data.evaluation || data)
      if (setAuthCredits) setAuthCredits(Math.max(0, (user?.credits ?? 100) - 20))
    } catch (err) {
      if (err.response?.status === 402 || err.response?.status === 403) {
        setIsPricingOpen(true)
      }
      setError(err.response?.data?.error || err.response?.data?.message || err.message || t('common.error', 'Evaluation failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', animation: 'fadeIn 0.4s ease forwards' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gold-dim)', color: 'var(--gold-hi)', flexShrink: 0 }}>
            <Star size={20} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 560, fontSize: 28, margin: 0, color: 'var(--text-1)' }}>
            {t('evaluator.title', 'Answer Evaluator')}
          </h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 0 56px', lineHeight: 1.5 }}>
          {t('evaluator.subtitle', 'Get expert evaluation with scores, rubric breakdown, and benchmark model answers.')}
        </p>
      </div>

      {/* ── Plan Lock Banner ── */}
      {isEvalLocked && (
        <div
          className="card"
          style={{
            padding: 32,
            marginBottom: 24,
            border: '1px solid var(--gold-border)',
            background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.08), rgba(0, 0, 0, 0.2))',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'var(--gold-dim)',
              color: 'var(--gold-hi)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--gold-border)',
            }}
          >
            <Lock size={26} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 650, color: 'var(--text-1)', margin: '0 0 8px' }}>
              {t('evaluator.lockedTitle', 'PRO & Officer Plan Exclusive')}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 580, margin: '0 auto', lineHeight: 1.6 }}>
              {t('evaluator.lockedDesc', 'Mains Answer Evaluation with AI OCR handwriting analysis & rubric scoring is exclusive to Group 1 Ranker PRO (₹999) and Officer Super Pass (₹1999) plans.')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPricingOpen(true)}
            style={{
              padding: '12px 28px',
              borderRadius: 12,
              background: 'linear-gradient(155deg, var(--gold-hi), var(--gold) 60%, #8a6e1c)',
              color: '#0A0F1C',
              fontSize: 14.5,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Lock size={15} /> {t('evaluator.upgradeBtn', 'Upgrade Plan to Unlock')}
          </button>
        </div>
      )}

      {/* ── Input Card ── */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>

          {/* Question */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              {t('evaluator.questionLabel', 'Question')}
            </label>
            <textarea
              value={form.question}
              onChange={(e) => handle('question', e.target.value)}
              rows={3}
              placeholder={t('evaluator.questionPlaceholder', 'Paste the Mains question you want to evaluate…')}
              className="input"
              style={{ minHeight: 88, lineHeight: 1.6 }}
            />
          </div>

          {/* Topic + Exam */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
                {t('common.topicOrSyllabus', 'Topic / Subject (optional)')}
              </label>
              <TopicAutocomplete
                value={form.topic}
                onChange={(v) => handle('topic', v)}
                exam={form.exam}
                placeholder={t('common.topicPlaceholder', 'Search or enter syllabus topic…')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
                {t('common.targetExam', 'Target Exam')}
              </label>
              <select
                value={form.exam}
                onChange={(e) => handle('exam', e.target.value)}
                className="input"
                style={{ height: 46 }}
              >
                {EXAMS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Marks */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              {t('evaluator.maxMarksLabel', 'Marks Weightage')}
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
                      padding: '9px 20px',
                      borderRadius: 10,
                      fontSize: 13.5,
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
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                {t('evaluator.answerLabel', 'Your Answer')}
              </label>
              <div style={{ display: 'flex', borderRadius: 8, background: 'var(--surface-elevated)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => switchMode('type')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    border: 'none',
                    background: answerMode === 'type' ? 'var(--surface)' : 'transparent',
                    color: answerMode === 'type' ? 'var(--text-1)' : 'var(--text-3)',
                    cursor: 'pointer',
                  }}
                >
                  <PenLine size={13} /> {t('evaluator.answerModeType', 'Type')}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('upload')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    border: 'none',
                    background: answerMode === 'upload' ? 'var(--surface)' : 'transparent',
                    color: answerMode === 'upload' ? 'var(--text-1)' : 'var(--text-3)',
                    cursor: 'pointer',
                  }}
                >
                  <Upload size={13} /> {t('evaluator.answerModeUpload', 'Upload (OCR)')}
                </button>
              </div>
            </div>

            {/* TYPE MODE */}
            {answerMode === 'type' && (
              <div style={{ position: 'relative' }}>
                <textarea
                  value={form.answer}
                  onChange={(e) => handle('answer', e.target.value.slice(0, charLimit))}
                  rows={9}
                  placeholder={t('evaluator.answerPlaceholder', 'Type or paste your complete written answer here…')}
                  className="input"
                  style={{ minHeight: 200, lineHeight: 1.6, paddingBottom: 28 }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 14,
                    fontSize: 11.5,
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
                      padding: 40,
                      borderRadius: 14,
                      cursor: 'pointer',
                      border: `2px dashed ${isDragging ? 'var(--indigo)' : 'var(--border)'}`,
                      background: isDragging ? 'var(--indigo-dim)' : 'var(--surface-elevated)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ width: 50, height: 50, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', color: 'var(--indigo)' }}>
                      <Upload size={24} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 4px' }}>
                        {isDragging ? t('evaluator.uploadDropzone', 'Drop your file here') : t('evaluator.uploadDropzone', 'Drag & drop or click to upload answer sheet')}
                      </p>
                      <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: 0 }}>
                        {t('evaluator.uploadFormats', 'Supports JPG, PNG, WEBP, and PDF up to 10 MB')}
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

                {uploadedFile && (
                  <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--indigo-dim)', color: 'var(--indigo)' }}>
                          {uploadedFile.type.startsWith('image/') ? <Image size={16} /> : <FileText size={16} />}
                        </div>
                        <div>
                          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>{uploadedFile.name}</p>
                          <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '2px 0 0' }}>{fmtSize(uploadedFile.size)}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {previewUrl && (
                          <button
                            type="button"
                            onClick={() => setShowPreview((s) => !s)}
                            className="btn-ghost"
                            style={{ padding: '5px 12px', fontSize: 12 }}
                          >
                            <Eye size={13} /> {showPreview ? 'Hide' : 'Preview'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={reExtract}
                          disabled={extracting}
                          className="btn-ghost"
                          style={{ padding: '5px 12px', fontSize: 12 }}
                        >
                          <RefreshCw size={13} className={extracting ? 'animate-spin' : ''} /> Re-extract
                        </button>
                        <button
                          type="button"
                          onClick={clearFile}
                          style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--red-dim)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {previewUrl && showPreview && (
                      <div style={{ padding: 14, borderTop: '1px solid var(--border-soft)' }}>
                        <img src={previewUrl} alt="Preview" style={{ maxHeight: 260, width: '100%', objectFit: 'contain', borderRadius: 8 }} />
                      </div>
                    )}

                    {extracting && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--indigo-dim)' }}>
                        <Loader2 size={16} style={{ color: 'var(--indigo)', animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: 12.5, color: 'var(--indigo)' }}>Reading handwriting with AI vision…</span>
                      </div>
                    )}

                    {extractMeta && !extracting && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--emerald-dim)', fontSize: 12.5, color: 'var(--emerald)' }}>
                        <CheckCircle size={14} />
                        <span>{extractMeta.chars} characters extracted ({methodLabel(extractMeta.method)})</span>
                      </div>
                    )}

                    {extractError && !extracting && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--red-dim)', fontSize: 12.5, color: 'var(--red)' }}>
                        <XCircle size={14} />
                        <span>{extractError}</span>
                      </div>
                    )}
                  </div>
                )}

                {(form.answer || extractMeta) && !extracting && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                      Extracted Text (review and edit):
                    </label>
                    <textarea
                      value={form.answer}
                      onChange={(e) => handle('answer', e.target.value.slice(0, charLimit))}
                      rows={8}
                      className="input"
                      style={{ minHeight: 180, lineHeight: 1.6 }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 10, marginBottom: 18, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 13.5 }}>
            <XCircle size={15} /> {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || extracting}
          style={{
            width: '100%',
            height: 48,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: 11,
            background: isEvalLocked
              ? 'var(--surface-elevated)'
              : 'linear-gradient(155deg, var(--gold-hi), var(--gold) 60%, #8a6e1c)',
            color: isEvalLocked ? 'var(--text-2)' : '#0A0F1C',
            fontSize: 15,
            fontWeight: 650,
            border: isEvalLocked ? '1px solid var(--gold-border)' : 'none',
            cursor: loading || extracting ? 'not-allowed' : 'pointer',
            opacity: loading || extracting ? 0.6 : 1,
            transition: 'all 0.15s ease',
          }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {t('evaluator.evaluating', 'Evaluating Answer…')}
            </>
          ) : isEvalLocked ? (
            <>
              <Lock size={17} style={{ color: 'var(--gold-hi)' }} />
              <span>{t('evaluator.upgradeBtn', 'Upgrade Plan to Unlock Evaluator')}</span>
            </>
          ) : (
            <>
              <Star size={18} />
              {t('evaluator.evaluateBtn', 'Evaluate Answer (20 Credits)')}
            </>
          )}
        </button>
      </div>

      {/* ── Pricing & Upgrade Modal ── */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        onPaymentSuccess={(updatedUser) => {
          if (updatedUser?.credits !== undefined && setAuthCredits) setAuthCredits(updatedUser.credits)
          setIsPricingOpen(false)
        }}
        reason={
          isEvalLocked
            ? 'Mains Answer Evaluation requires Group 1 Ranker PRO (₹999) or Officer Super Pass (₹1999) plan.'
            : 'Mains Answer Evaluation requires 20 credits.'
        }
      />

      {/* ── Loading ── */}
      {loading && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <LoadingDots message={t('evaluator.loadingMessage', 'Evaluating your answer against APPSC topper benchmarks…')} />
        </div>
      )}

      {/* ── Results ── */}
      {result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease forwards' }}>
          {/* Score + Comment */}
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 18 }}>
            <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ScoreRing score={result.score || 0} maxScore={result.maxScore || form.marks} />
            </div>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gold-dim)', color: 'var(--gold-hi)' }}>
                  <MessageSquare size={15} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 560, margin: 0, color: 'var(--text-1)' }}>
                  {t('evaluator.examinerComment', "Examiner's Feedback")}
                </h3>
              </div>
              <p style={{ fontSize: 14, fontStyle: 'italic', lineHeight: 1.65, color: 'var(--text-2)', borderLeft: '3px solid var(--gold)', paddingLeft: 16, margin: 0 }}>
                {result.examinerComment || 'No comment available.'}
              </p>
            </div>
          </div>

          {/* Rubric Breakdown */}
          {result.criteria?.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 560, margin: '0 0 18px', color: 'var(--text-1)' }}>
                {t('evaluator.rubricBreakdown', 'Rubric Breakdown')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {result.strengths?.length > 0 && (
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <CheckCircle size={16} style={{ color: 'var(--emerald)' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 560, margin: 0, color: 'var(--text-1)' }}>
                    {t('evaluator.strengths', 'Strengths')}
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.strengths.map((s, i) => (
                    <div key={i} style={{ padding: '11px 14px', borderRadius: 9, background: 'var(--emerald-dim)', border: '1px solid var(--emerald-border)', fontSize: 13.5, color: 'var(--text-1)', lineHeight: 1.5 }}>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.improvements?.length > 0 && (
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <AlertTriangle size={16} style={{ color: 'var(--gold-hi)' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 560, margin: 0, color: 'var(--text-1)' }}>
                    {t('evaluator.improvements', 'Areas to Improve')}
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.improvements.map((s, i) => (
                    <div key={i} style={{ padding: '11px 14px', borderRadius: 9, background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', fontSize: 13.5, color: 'var(--text-1)', lineHeight: 1.5 }}>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Model Answer */}
          {result.modelAnswer && (
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--indigo-dim)', color: 'var(--indigo)' }}>
                  <BookMarked size={15} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 560, margin: 0, color: 'var(--text-1)' }}>
                  {t('evaluator.modelAnswer', 'Model Answer Reference')}
                </h3>
              </div>
              <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '22px 26px' }} className="prose-dark">
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
