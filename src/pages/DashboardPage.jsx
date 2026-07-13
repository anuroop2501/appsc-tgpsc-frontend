import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap,
  BookOpen,
  Star,
  Sparkles,
  ArrowRight,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { getStats, getHistory } from '../api/history'
import SessionDetailModal from '../components/SessionDetailModal'

/* ── Animated counter ── */
const AnimatedNumber = ({ target, suffix = '' }) => {
  const [current, setCurrent] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (target === 0) return
    const start = performance.now()
    const duration = 1200

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setCurrent(Math.floor(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target])

  return (
    <span>
      {current}
      {suffix}
    </span>
  )
}

/* ── Time ago helper ── */
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return '';
  const diff = Date.now() - parsed.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TYPE_META = {
  prelims: { label: 'MCQ', color: '#4F8EF7', bg: 'rgba(79,142,247,0.15)' },
  notes: { label: 'Notes', color: '#7B5EF8', bg: 'rgba(123,94,248,0.15)' },
  evaluation: { label: 'Eval', color: '#F5A623', bg: 'rgba(245,166,35,0.15)' },
}

const DashboardPage = () => {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const [stats, setStats] = useState({ sessionsCount: 0, prelimsCount: 0, notesCount: 0, evalsCount: 0 })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, historyData] = await Promise.allSettled([
          getStats(),
          getHistory({ page: 1, type: 'all' }),
        ])
        if (statsData.status === 'fulfilled') {
          setStats(statsData.value.stats || statsData.value || { sessionsCount: 0, prelimsCount: 0, notesCount: 0, evalsCount: 0 })
        }
        if (historyData.status === 'fulfilled') {
          const items = historyData.value?.sessions || historyData.value?.items || historyData.value || []
          setRecentActivity(Array.isArray(items) ? items.slice(0, 5) : [])
        }
      } catch {
        /* silently handle */
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    {
      label: 'All Activity',
      value: stats.sessionsCount,
      icon: Activity,
      gradient: 'linear-gradient(135deg, #4F8EF7, #3b7de0)',
      glow: 'rgba(79,142,247,0.3)',
      suffix: '',
      activeTab: 'all',
    },
    {
      label: 'MCQ Practice',
      value: stats.prelimsCount,
      icon: Sparkles,
      gradient: 'linear-gradient(135deg, #10B981, #059669)',
      glow: 'rgba(16,185,129,0.3)',
      suffix: '',
      activeTab: 'prelims',
    },
    {
      label: 'Study Notes',
      value: stats.notesCount,
      icon: BookOpen,
      gradient: 'linear-gradient(135deg, #7B5EF8, #6a48e0)',
      glow: 'rgba(123,94,248,0.3)',
      suffix: '',
      activeTab: 'notes',
    },
    {
      label: 'Answers Evaluated',
      value: stats.evalsCount,
      icon: Star,
      gradient: 'linear-gradient(135deg, #F5A623, #e8930f)',
      glow: 'rgba(245,166,35,0.3)',
      suffix: '',
      activeTab: 'evaluation',
    },
  ]

  const featureCards = [
    {
      title: 'MCQ Prelims',
      desc: 'Generate 10 exam-ready MCQs instantly from any topic',
      icon: Sparkles,
      gradient: 'linear-gradient(135deg, rgba(79,142,247,0.15), rgba(79,142,247,0.05))',
      border: 'rgba(79,142,247,0.3)',
      iconBg: 'linear-gradient(135deg, #4F8EF7, #3b7de0)',
      glow: 'rgba(79,142,247,0.2)',
      path: '/prelims',
      accent: '#4F8EF7',
    },
    {
      title: 'Mains Notes',
      desc: 'AI-structured notes tailored to your exam pattern',
      icon: BookOpen,
      gradient: 'linear-gradient(135deg, rgba(123,94,248,0.15), rgba(123,94,248,0.05))',
      border: 'rgba(123,94,248,0.3)',
      iconBg: 'linear-gradient(135deg, #7B5EF8, #6a48e0)',
      glow: 'rgba(123,94,248,0.2)',
      path: '/notes',
      accent: '#7B5EF8',
    },
    {
      title: 'Answer Evaluator',
      desc: 'Get expert AI feedback on your mains answers with scores',
      icon: Star,
      gradient: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,166,35,0.05))',
      border: 'rgba(245,166,35,0.3)',
      iconBg: 'linear-gradient(135deg, #F5A623, #e8930f)',
      glow: 'rgba(245,166,35,0.2)',
      path: '/evaluator',
      accent: '#F5A623',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* ── Welcome header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}
          >
            Welcome back,{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #4F8EF7, #7B5EF8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {user?.name?.split(' ')[0] || 'Aspirant'}
            </span>{' '}
            👋
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
            Ready to ace your exam today? Let's get studying.
          </p>
        </div>
        {user?.targetExam && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{
              background: 'rgba(79, 142, 247, 0.12)',
              border: '1px solid rgba(79, 142, 247, 0.3)',
              color: 'var(--color-accent)',
              fontFamily: 'Sora, sans-serif',
            }}
          >
            <TrendingUp size={14} />
            {user.targetExam}
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        {statCards.map(({ label, value, icon: Icon, gradient, glow, suffix, activeTab }) => (
          <button
            key={label}
            onClick={() => navigate('/history', { state: { activeTab } })}
            className="glass-card p-5 text-left animate-slide-up group hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200"
            style={{ 
              boxShadow: `0 4px 24px ${glow}`,
              cursor: 'pointer',
              background: 'rgba(19, 24, 38, 0.4)',
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--color-muted)', fontFamily: 'Sora, sans-serif' }}>
                  {label}
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}
                >
                  {loading ? '—' : <AnimatedNumber target={value} suffix={suffix} />}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
                style={{ background: gradient, boxShadow: `0 4px 12px ${glow}` }}
              >
                <Icon size={18} className="text-white" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Feature Cards ── */}
      <div>
        <h2
          className="text-lg font-bold mb-4"
          style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}
        >
          AI Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
          {featureCards.map(({ title, desc, icon: Icon, gradient, border, iconBg, glow, path, accent }) => (
            <button
              key={title}
              onClick={() => navigate(path)}
              className="glass-card p-6 text-left group animate-slide-up"
              style={{
                background: gradient,
                borderColor: border,
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 16px 40px ${glow}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: iconBg, boxShadow: `0 4px 12px ${glow}` }}
              >
                <Icon size={22} className="text-white" />
              </div>
              <h3
                className="text-base font-bold mb-1.5"
                style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}
              >
                {title}
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-muted)' }}>
                {desc}
              </p>
              <div
                className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all"
                style={{ color: accent }}
              >
                Get started
                <ArrowRight size={13} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}
          >
            Recent Activity
          </h2>
          <button
            onClick={() => navigate('/history')}
            className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-accent)' }}
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="skeleton w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3.5 w-1/3 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="p-10 flex flex-col items-center text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(79, 142, 247, 0.1)' }}
              >
                <Clock size={28} style={{ color: 'var(--color-accent)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                No activity yet
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                Start with an MCQ session or generate study notes
              </p>
            </div>
          ) : (
            <div>
              {recentActivity.map((item, i) => {
                const meta = TYPE_META[item.type] || TYPE_META.prelims
                return (
                  <div
                    key={item.id || i}
                    onClick={() => navigate('/history', { state: { viewSessionId: item.id } })}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors cursor-pointer"
                    style={{
                      borderBottom: i < recentActivity.length - 1 ? '1px solid var(--color-border)' : 'none',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: meta.bg, color: meta.color, fontFamily: 'Sora, sans-serif' }}
                    >
                      {meta.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {item.topic || 'Unknown topic'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        {item.exam || ''}
                        {item.score !== undefined && ` · Score: ${item.score}/${item.maxScore || 10}`}
                        {item.noteType && ` · ${item.noteType}`}
                      </p>
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-muted)' }}>
                      {timeAgo(item.created_at || item.createdAt || item.timestamp)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
