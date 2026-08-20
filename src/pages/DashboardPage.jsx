import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Star, Sparkles, ArrowRight, Clock, Activity, Flame } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { getStats, getHistory } from '../api/history'

/* ── Animated counter ── */
const AnimatedNumber = ({ target }) => {
  const [current, setCurrent] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (target === 0) return
    const start = performance.now()
    const duration = 1200
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.floor(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target])

  return <span>{current}</span>
}

/* ── Time ago helper ── */
const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const parsed = new Date(dateStr)
  if (isNaN(parsed.getTime())) return ''
  const diff = Date.now() - parsed.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/* ── Calculate Day Streak from session dates ── */
const calculateStreak = (sessions = []) => {
  if (!sessions || sessions.length === 0) return 0
  const uniqueDays = new Set(
    sessions
      .map(s => (s.created_at || s.createdAt || s.timestamp))
      .filter(Boolean)
      .map(d => new Date(d).toISOString().slice(0, 10))
  )
  
  let streak = 0
  let checkDate = new Date()
  
  // Check today or yesterday
  const todayStr = checkDate.toISOString().slice(0, 10)
  checkDate.setDate(checkDate.getDate() - 1)
  const yesterdayStr = checkDate.toISOString().slice(0, 10)

  if (!uniqueDays.has(todayStr) && !uniqueDays.has(yesterdayStr)) {
    return uniqueDays.size > 0 ? 1 : 0
  }

  // Count consecutive days
  let currentCheck = uniqueDays.has(todayStr) ? new Date() : checkDate
  while (true) {
    const dStr = currentCheck.toISOString().slice(0, 10)
    if (uniqueDays.has(dStr)) {
      streak++
      currentCheck.setDate(currentCheck.getDate() - 1)
    } else {
      break
    }
  }
  return Math.max(streak, 1)
}

const TYPE_META = {
  prelims:    { label: 'MCQ',   colorVar: 'var(--indigo)',  dimVar: 'var(--indigo-dim)' },
  notes:      { label: 'NOTES', colorVar: 'var(--emerald)', dimVar: 'var(--emerald-dim)' },
  evaluation: { label: 'EVAL',  colorVar: 'var(--gold-hi)', dimVar: 'var(--gold-dim)' },
}

const STAT_CARDS = (stats) => [
  { label: 'Total Activity',     value: stats.sessionsCount, icon: Activity, accent: 'var(--indigo)', dim: 'var(--indigo-dim)', tab: 'all' },
  { label: 'MCQ Practice',       value: stats.prelimsCount,  icon: Sparkles, accent: 'var(--indigo)', dim: 'var(--indigo-dim)', tab: 'prelims' },
  { label: 'Study Notes',        value: stats.notesCount,    icon: BookOpen, accent: 'var(--emerald)', dim: 'var(--emerald-dim)', tab: 'notes' },
  { label: 'Answers Evaluated',  value: stats.evalsCount,    icon: Star,     accent: 'var(--gold-hi)', dim: 'var(--gold-dim)', tab: 'evaluation' },
]

const DashboardPage = () => {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const [stats, setStats] = useState({ sessionsCount: 0, prelimsCount: 0, notesCount: 0, evalsCount: 0 })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, historyData] = await Promise.allSettled([
          getStats(),
          getHistory({ page: 1, type: 'all' }),
        ])
        if (statsData.status === 'fulfilled') {
          setStats(statsData.value.stats || statsData.value || {})
        }
        if (historyData.status === 'fulfilled') {
          const items = historyData.value?.sessions || historyData.value?.items || historyData.value || []
          setRecentActivity(Array.isArray(items) ? items.slice(0, 5) : [])
          setStreak(calculateStreak(items))
        }
      } catch { /* silent */ } finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const isGroup2 = (user?.targetExam || '').toLowerCase().includes('group 2')
  const firstName = user?.name?.split(' ')[0] || 'Aspirant'

  const featureCards = [
    { title: 'MCQ Prelims', desc: 'Generate ten exam-ready MCQs instantly from any topic, weighted to the APPSC Prelims pattern.', icon: Sparkles, color: 'indigo', path: '/prelims', cta: 'Start practice' },
    { title: isGroup2 ? 'Group 2 Notes' : 'Mains Notes', desc: 'AI-structured notes tailored to your exam pattern, organised by subtopic for quick revision.', icon: BookOpen, color: 'emerald', path: '/notes', cta: 'Generate notes' },
    ...(!isGroup2 ? [{ title: 'Answer Evaluator', desc: 'Get expert AI feedback on your Mains answers with scores, benchmarked against topper responses.', icon: Star, color: 'gold', path: '/evaluator', cta: 'Evaluate an answer' }] : []),
  ]

  const cardColors = {
    indigo: { border: 'var(--indigo)', dim: 'var(--indigo-dim)', cta: 'var(--indigo)', iconBg: 'var(--indigo-dim)' },
    emerald: { border: 'var(--emerald)', dim: 'var(--emerald-dim)', cta: 'var(--emerald)', iconBg: 'var(--emerald-dim)' },
    gold: { border: 'var(--gold)', dim: 'var(--gold-dim)', cta: 'var(--gold-hi)', iconBg: 'var(--gold-dim)' },
  }

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', animation: 'fadeIn 0.4s ease forwards' }}>

      {/* ── HERO ── */}
      <section
        style={{
          display: 'grid', gridTemplateColumns: '1fr 240px', gap: 32, alignItems: 'center',
          paddingBottom: 32, marginBottom: 32, borderBottom: '1px solid var(--border-soft)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="tag tag-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Flame size={12} /> {streak} Day Practice Streak
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>• Daily AI prep loop</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 560, fontSize: 34, letterSpacing: '-0.3px', lineHeight: 1.15, margin: '0 0 10px', color: 'var(--text-1)' }}>
            Welcome back, <em style={{ fontStyle: 'normal', color: 'var(--gold-hi)' }}>{firstName}.</em>
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14.5, maxWidth: 500, margin: 0, lineHeight: 1.6 }}>
            {loading
              ? 'Loading your stats…'
              : `You've completed ${stats.sessionsCount || 0} practice sessions across Prelims & Mains. Practice consistently every day to maintain your study momentum.`
            }
          </p>
        </div>

        {/* Practice Streak Card */}
        <div
          className="card"
          style={{
            padding: '22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center',
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gold-dim)', color: 'var(--gold-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={26} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>
            {streak} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>Days</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold-hi)' }}>
            Active Daily Streak
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>
            Generate MCQs, notes or evaluations daily to keep this alive!
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
        {STAT_CARDS(stats).map(({ label, value, icon: Icon, accent, dim, tab }) => (
          <button
            key={label}
            onClick={() => navigate('/history', { state: { activeTab: tab } })}
            className="card"
            style={{
              padding: 20, textAlign: 'left', cursor: 'pointer',
              transition: 'transform 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = accent }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>
                {label}
              </span>
              <div style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: dim, color: accent, flexShrink: 0 }}>
                <Icon size={15} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.5px' }}>
              {loading ? '—' : <AnimatedNumber target={value || 0} />}
            </div>
          </button>
        ))}
      </section>

      {/* ── AI TOOLS ── */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 560, color: 'var(--text-1)', margin: 0 }}>AI Study Modules</h2>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Everything you need for APPSC &amp; TGPSC</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${featureCards.length}, 1fr)`, gap: 18 }}>
          {featureCards.map(({ title, desc, icon: Icon, color, path, cta }) => {
            const c = cardColors[color]
            return (
              <button
                key={title}
                onClick={() => navigate(path)}
                className="card"
                style={{
                  padding: 24, textAlign: 'left', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                  borderLeft: `3px solid ${c.border}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, background: c.iconBg, color: c.border }}>
                  <Icon size={20} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 560, margin: '0 0 8px', color: 'var(--text-1)' }}>
                  {title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, margin: '0 0 20px', minHeight: 40 }}>
                  {desc}
                </p>
                <span style={{ fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, color: c.cta }}>
                  {cta} <ArrowRight size={13} />
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── RECENT ACTIVITY ── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 560, color: 'var(--text-1)', margin: 0 }}>Recent Activity</h2>
          <button
            onClick={() => navigate('/history')}
            style={{ fontSize: 12.5, color: 'var(--indigo)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            View all history →
          </button>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-elevated)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, width: '40%', borderRadius: 4, background: 'var(--surface-elevated)', marginBottom: 8 }} />
                    <div style={{ height: 10, width: '60%', borderRadius: 4, background: 'var(--border)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Clock size={28} style={{ color: 'var(--text-3)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 500, margin: '0 0 4px' }}>No activity yet</p>
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: 0 }}>Start with an MCQ session or generate study notes</p>
            </div>
          ) : (
            recentActivity.map((item, i) => {
              const meta = TYPE_META[item.type] || TYPE_META.prelims
              return (
                <div
                  key={item.id || i}
                  onClick={() => navigate('/history', { state: { viewSessionId: item.id } })}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '16px 20px', cursor: 'pointer',
                    borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border-soft)' : 'none',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span className="tag" style={{ background: meta.dimVar, color: meta.colorVar, marginTop: 2, flexShrink: 0 }}>
                    {meta.label}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.5 }}>
                      {item.topic || 'Unknown topic'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                      {item.exam || ''}
                      {item.score !== undefined && ` · Score: ${item.score}/${item.maxScore || 10}`}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', paddingTop: 2 }}>
                    {timeAgo(item.created_at || item.createdAt || item.timestamp)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
