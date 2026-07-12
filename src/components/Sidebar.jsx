import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Star,
  Clock,
  LogOut,
  Zap,
  X,
  ChevronRight,
} from 'lucide-react'
import useAuthStore from '../store/authStore'

const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    section: 'AI Tools',
    items: [
      { to: '/prelims', icon: Sparkles, label: 'MCQ Prelims' },
      { to: '/notes', icon: BookOpen, label: 'Mains Notes' },
      { to: '/evaluator', icon: Star, label: 'Answer Evaluator' },
    ],
  },
  {
    section: 'Account',
    items: [
      { to: '/history', icon: Clock, label: 'Study History' },
    ],
  },
]

const Sidebar = ({ open, onClose, isMobile }) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  if (!open) return null

  return (
    <aside
      className="fixed top-0 left-0 h-full z-40 flex flex-col"
      style={{
        width: 240,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #4F8EF7, #7B5EF8)' }}
          >
            <Zap size={18} className="text-white" />
          </div>
          <span
            className="text-lg font-bold"
            style={{ fontFamily: 'Sora, sans-serif', background: 'linear-gradient(135deg, #4F8EF7, #7B5EF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            ExamEdge
          </span>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5"
            style={{ color: 'var(--color-muted)' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Exam Badge ── */}
      {user?.targetExam && (
        <div className="px-4 py-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{
              background: 'rgba(79, 142, 247, 0.12)',
              border: '1px solid rgba(79, 142, 247, 0.3)',
              color: 'var(--color-accent)',
              fontFamily: 'Sora, sans-serif',
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ background: 'var(--color-accent)' }} />
            {user.targetExam}
          </div>
        </div>
      )}

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {NAV_ITEMS.map(({ section, items }) => (
          <div key={section} className="mb-5">
            <p
              className="px-3 mb-1.5 text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'var(--color-muted)', fontFamily: 'Sora, sans-serif' }}
            >
              {section}
            </p>
            {items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={isMobile ? onClose : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium group relative transition-all duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'hover:bg-white/5'
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive ? '#fff' : 'var(--color-muted)',
                  background: isActive ? 'rgba(79, 142, 247, 0.15)' : undefined,
                  borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
                })}
              >
                <Icon
                  size={17}
                  className="flex-shrink-0"
                  style={{ color: 'inherit' }}
                />
                <span style={{ fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
                <ChevronRight
                  size={14}
                  className="ml-auto opacity-0 group-hover:opacity-50 -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
                />
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── User Footer ── */}
      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #4F8EF7, #7B5EF8)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--color-text)', fontFamily: 'Sora, sans-serif' }}
            >
              {user?.name || 'User'}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: 'var(--color-muted)' }}
            >
              {user?.email || ''}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-red/10 group"
          style={{ color: 'var(--color-muted)' }}
        >
          <LogOut size={15} className="group-hover:text-red-400 transition-colors" style={{ color: 'var(--color-red)' }} />
          <span className="group-hover:text-red-400" style={{ color: 'var(--color-red)' }}>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
