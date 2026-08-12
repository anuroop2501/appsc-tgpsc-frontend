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
  ClipboardList,
  CreditCard,
  FileText,
} from 'lucide-react'
import useAuthStore from '../store/authStore'

// ─── Helper: derive nav from exam ────────────────────────────────────────────
function getNavItems(targetExam = '') {
  const exam = (targetExam || '').toLowerCase()

  // Group 2 exams: no Mains Notes, no Answer Evaluator; instead show "Group 2 Notes"
  const isGroup2 = exam.includes('group 2')

  const aiItems = [
    { to: '/prelims', icon: Sparkles, label: 'MCQ Prelims' },
    // { to: '/test',    icon: ClipboardList, label: 'Mock Test' },
  ]

  if (isGroup2) {
    aiItems.push({ to: '/notes', icon: FileText, label: 'Group 2 Notes' })
    // Mains Notes & Answer Evaluator are NOT available for Group 2
  } else {
    aiItems.push({ to: '/notes',     icon: BookOpen, label: 'Mains Notes' })
    aiItems.push({ to: '/evaluator', icon: Star,     label: 'Answer Evaluator' })
  }

  return [
    {
      section: 'Overview',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      section: 'AI Tools',
      items: aiItems,
    },
    {
      section: 'Account',
      items: [
        { to: '/history', icon: Clock,       label: 'Study History' },
        { to: '/pricing', icon: CreditCard,  label: 'Plans & Pricing' },
      ],
    },
  ]
}

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

  const NAV_ITEMS = getNavItems(user?.targetExam)

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
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #1579E6, #F7B500)' }}
          >
            <Zap size={18} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span
              className="text-lg font-extrabold leading-tight tracking-tight"
              style={{ fontFamily: 'Sora, sans-serif', background: 'linear-gradient(135deg, #1579E6, #60A5FA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              APPSC <span style={{ color: '#F7B500', WebkitTextFillColor: '#F7B500' }}>AI</span>
            </span>
          </div>
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
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-1 text-sm font-semibold group relative transition-all duration-200 ${
                    isActive
                      ? 'shadow-sm'
                      : 'hover:bg-slate-200/60 dark:hover:bg-white/5'
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive ? '#FFFFFF' : 'var(--color-muted)',
                  background: isActive ? 'linear-gradient(135deg, #1579E6, #2563EB)' : undefined,
                  boxShadow: isActive ? '0 4px 14px rgba(37, 99, 235, 0.35)' : undefined,
                })}
              >
                <Icon
                  size={18}
                  className="flex-shrink-0"
                  style={{ color: 'inherit' }}
                />
                <span style={{ fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
                <ChevronRight
                  size={14}
                  className="ml-auto opacity-0 group-hover:opacity-60 -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
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
