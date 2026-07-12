import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import TopicAutocomplete from '../components/TopicAutocomplete'
import MCQCard from '../components/MCQCard'
import LoadingDots from '../components/LoadingDots'
import { generatePrelims } from '../api/prelims'
import useAuthStore from '../store/authStore'

const EXAMS = ['APPSC Group 1', 'APPSC Group 2', 'TGPSC Group 1', 'TGPSC Group 2']

const PrelimsPage = () => {
  const user = useAuthStore((s) => s.user)
  const defaultExam = user?.targetExam || EXAMS[0]

  const [topic, setTopic] = useState('')
  const [exam, setExam] = useState(defaultExam)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fromCache, setFromCache] = useState(false)

  /* Score tracker */
  const answered = questions.filter((_, i) => {
    const card = document.getElementById(`mcq-answered-${i}`)
    return card !== null
  }).length

  const [answeredCount, setAnsweredCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter or select a topic.')
      return
    }
    setLoading(true)
    setError('')
    setQuestions([])
    setAnsweredCount(0)
    setCorrectCount(0)
    setFromCache(false)

    try {
      const data = await generatePrelims({ topic, exam })
      setQuestions(data)
      setFromCache(!!data._fromCache)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate questions.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4F8EF7, #3b7de0)', boxShadow: '0 4px 12px rgba(79,142,247,0.35)' }}
          >
            <Sparkles size={20} className="text-white" />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}
          >
            MCQ Prelims Generator
          </h1>
        </div>
        <p className="text-sm ml-14" style={{ color: 'var(--color-muted)' }}>
          Generate 10 exam-pattern multiple choice questions from any APPSC/TGPSC topic
        </p>
      </div>

      {/* ── Input Card ── */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Topic */}
          <div className="md:col-span-2">
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text)' }}
            >
              Topic
            </label>
            <TopicAutocomplete
              value={topic}
              onChange={setTopic}
              exam={exam}
              placeholder="e.g. Fundamental Rights, Telangana History…"
            />
          </div>

          {/* Exam selector */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text)' }}
            >
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

          {/* Generate button */}
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary w-full justify-center"
              style={{ height: 46 }}
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  Generate Questions
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{
              background: 'rgba(247, 111, 111, 0.1)',
              border: '1px solid rgba(247, 111, 111, 0.3)',
              color: 'var(--color-red)',
            }}
          >
            <XCircle size={15} />
            {error}
          </div>
        )}

        {/* Cache badge */}
        {fromCache && (
          <div
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full mt-3"
            style={{ background: 'rgba(61,214,140,0.12)', color: 'var(--color-green)', border: '1px solid rgba(61,214,140,0.3)' }}
          >
            <CheckCircle size={12} />
            Loaded from cache
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="glass-card">
          <LoadingDots message="AI is crafting your questions…" />
        </div>
      )}

      {/* ── Results ── */}
      {!loading && questions.length > 0 && (
        <>
          {/* Score tracker */}
          <div
            className="glass-card px-5 py-4 flex items-center justify-between flex-wrap gap-3"
          >
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Questions</p>
                <p className="text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                  {questions.length}
                </p>
              </div>
              <div className="w-px h-8" style={{ background: 'var(--color-border)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Answered</p>
                <p className="text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-accent)' }}>
                  {answeredCount} / {questions.length}
                </p>
              </div>
              <div className="w-px h-8" style={{ background: 'var(--color-border)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Correct</p>
                <p className="text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-green)' }}>
                  {correctCount} / {answeredCount || '—'}
                </p>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all hover:bg-white/5"
              style={{ color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}
            >
              <RefreshCw size={14} />
              Regenerate
            </button>
          </div>

          {/* MCQ Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {questions.map((q, i) => {
              // Normalise options — API returns { A: '...', B: '...', C: '...', D: '...' }
              // MCQCard expects an array ['...', '...', '...', '...']
              const rawOptions = q.opts || q.options || {}
              const optionsArray = Array.isArray(rawOptions)
                ? rawOptions
                : ['A', 'B', 'C', 'D'].map((k) => rawOptions[k] || '')

              // correctAnswer is a letter like 'B' — convert to 0-based index
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
