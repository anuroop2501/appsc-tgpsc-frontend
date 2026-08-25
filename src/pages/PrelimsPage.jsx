import { useState, useEffect } from 'react'
import { Sparkles, Loader2, CheckCircle, XCircle, RefreshCw, Download } from 'lucide-react'
import TopicAutocomplete from '../components/TopicAutocomplete'
import MCQCard from '../components/MCQCard'
import LoadingDots from '../components/LoadingDots'
import PricingModal from '../components/PricingModal'
import { generatePrelimsStream } from '../api/prelims'
import { getUserBalance } from '../api/payment'
import { exportPrelimsToPdf } from '../lib/exportPdf'
import useAuthStore from '../store/authStore'
import { useLanguage } from '../context/LanguageContext'

const EXAMS = ['APPSC Group 1', 'APPSC Group 2']

const PrelimsPage = () => {
  const user = useAuthStore((s) => s.user)
  const defaultExam = user?.targetExam || EXAMS[0]
  const { language, t } = useLanguage()

  const [topic, setTopic] = useState('')
  const [exam, setExam] = useState(defaultExam)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fromCache, setFromCache] = useState(false)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const setAuthCredits = useAuthStore((s) => s.setCredits)
  const credits = user?.credits !== undefined ? user.credits : 100
  const [isPricingOpen, setIsPricingOpen] = useState(false)

  // Fetch updated credits on mount
  useEffect(() => {
    if (user?.id || user?.userId) {
      getUserBalance()
        .then((res) => {
          if (res?.credits !== undefined) setAuthCredits(res.credits)
        })
        .catch((err) => console.error('[Prelims] Error fetching balance:', err.message))
    }
  }, [user?.id, user?.userId, setAuthCredits])

  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  const handleGenerate = async () => {
    if (credits < 10) {
      setError(t('common.insufficientCredits', 'Insufficient credits (10 required). Please recharge or upgrade.'))
      setIsPricingOpen(true)
      return
    }

    if (!topic.trim()) { setError(t('common.topicPlaceholder', 'Please enter or select a topic.')); return }
    setLoading(true); setError(''); setQuestions([])
    setAnsweredCount(0); setCorrectCount(0); setFromCache(false)
    setProgress(10)
    setStatusMessage(t('prelims.statusRAG', 'Retrieving syllabus & PYQ archive from Knowledge Base...'))

    try {
      const data = await generatePrelimsStream({
        topic,
        exam,
        language,
        onProgress: ({ progress: p, message: m }) => {
          if (p !== undefined) setProgress(p)
          if (m) setStatusMessage(m)
        },
      })
      setProgress(100)
      setQuestions(data)
      setFromCache(!!data._fromCache)
    } catch (err) {
      if (err.message?.includes('402') || err.response?.status === 402) {
        setIsPricingOpen(true)
      }
      setError(err.response?.data?.message || err.response?.data?.error || err.message || t('common.error', 'Failed to generate questions.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', animation: 'fadeIn 0.4s ease forwards' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--indigo-dim)', color: 'var(--indigo)', flexShrink: 0 }}>
            <Sparkles size={20} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 560, fontSize: 28, margin: 0, color: 'var(--text-1)' }}>
            {t('prelims.title', 'MCQ Prelims')}
          </h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 0 56px', lineHeight: 1.5 }}>
          {t('prelims.subtitle', 'Generate 10 exam-pattern multiple choice questions from any APPSC topic')}
        </p>
      </div>

      {/* ── Input Card ── */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Topic */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              {t('common.topicOrSyllabus', 'Topic / Syllabus Area')}
            </label>
            <TopicAutocomplete
              value={topic}
              onChange={setTopic}
              exam={exam}
              placeholder={t('common.topicPlaceholder', 'e.g. Fundamental Rights, Andhra Pradesh History, Economy & Planning…')}
            />
          </div>

          {/* Exam & Button Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
                {t('common.targetExam', 'Target Exam')}
              </label>
              <select value={exam} onChange={(e) => setExam(e.target.value)} className="input" style={{ height: 46 }}>
                {EXAMS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={handleGenerate} disabled={loading} className="btn-primary" style={{ width: '100%', height: 46, fontSize: 14.5 }}>
                {loading
                  ? <><Loader2 size={17} className="animate-spin" /> {t('prelims.generating', 'Preparing…')}</>
                  : <><Sparkles size={17} /> {t('prelims.generateBtn', 'Generate Questions (10 Credits)')}</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 10, marginTop: 16, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 13.5 }}>
            <XCircle size={15} /> {error}
          </div>
        )}

        {/* Cache badge */}
        {fromCache && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 12px', borderRadius: 20, marginTop: 14, background: 'var(--emerald-dim)', color: 'var(--emerald)', border: '1px solid var(--emerald-border)' }}>
            <CheckCircle size={13} /> {t('common.loadedFromCache', 'Loaded from cache')}
          </div>
        )}
      </div>

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        onSuccess={(updatedUser) => {
          if (updatedUser?.credits !== undefined) setAuthCredits(updatedUser.credits)
          setIsPricingOpen(false)
        }}
        reason="Generating MCQ practice sets requires 10 credits."
      />

      {/* ── Progress / Status Bar ── */}
      {loading && (
        <div className="card" style={{ padding: '36px 28px', textAlign: 'center', marginBottom: 24, animation: 'fadeIn 0.3s ease forwards' }}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)' }}>
                {statusMessage}
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--indigo)' }}>
                {Math.round(progress)}%
              </span>
            </div>

            {/* Modern Animated Gradient Progress Bar */}
            <div style={{ width: '100%', height: 8, borderRadius: 999, background: 'var(--border)', overflow: 'hidden', position: 'relative' }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #4F8EF7, #3DD68C)',
                  transition: 'width 0.4s ease',
                  boxShadow: '0 0 12px rgba(79,142,247,0.4)',
                }}
              />
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12, margin: '12px 0 0' }}>
              {t('prelims.generatingSubtitle', 'Generating standard syllabus MCQs, distractor breakdown & references...')}
            </p>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {!loading && questions.length > 0 && (
        <>
          {/* Score tracker */}
          <div className="card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {[
                { label: t('prelims.questionNum', 'Questions'), value: questions.length, color: 'var(--text-1)' },
                { label: t('prelims.answered', 'Answered'), value: `${answeredCount} / ${questions.length}`, color: 'var(--indigo)' },
                { label: t('prelims.correct', 'Correct'), value: `${correctCount} / ${answeredCount || '—'}`, color: 'var(--emerald)' },
              ].map(({ label, value, color }, i, arr) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color, margin: 0 }}>{value}</p>
                  </div>
                  {i < arr.length - 1 && <div style={{ width: 1, height: 32, background: 'var(--border)' }} />}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => exportPrelimsToPdf({ topic, exam, questions })}
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 9, background: 'var(--indigo-dim)', color: 'var(--indigo)', border: '1px solid var(--indigo-border)', cursor: 'pointer' }}
              >
                <Download size={14} /> {t('common.downloadPdf', 'Download PDF')}
              </button>
              <button onClick={handleGenerate} className="btn-ghost" style={{ fontSize: 13, padding: '8px 16px' }}>
                <RefreshCw size={13} /> {t('common.tryAgain', 'Regenerate')}
              </button>
            </div>
          </div>

          {/* MCQ Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
            {questions.map((q, i) => {
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
                  key={i}
                  index={i}
                  question={q.question || q.q}
                  options={optionsArray}
                  correctAnswer={correctIndex}
                  explanation={q.explanation || q.exp}
                  type={q.type}
                  pyqSource={q.pyq_source || q.pyqSource || q.source}
                  reference={q.reference || q.source}
                  onAnswer={(isCorrect) => {
                    setAnsweredCount((c) => c + 1)
                    if (isCorrect) setCorrectCount((c) => c + 1)
                  }}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default PrelimsPage
