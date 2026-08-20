import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Star,
  Clock,
  LogOut,
  X,
  CreditCard,
  FileText,
  Calendar,
} from 'lucide-react'
import useAuthStore from '../store/authStore'

// ─── Helper: derive nav from exam ────────────────────────────────────────────
function getNavItems(targetExam = '') {
  const exam = (targetExam || '').toLowerCase()
  const isGroup2 = exam.includes('group 2')

  const aiItems = [
    { to: '/prelims', icon: Sparkles, label: 'MCQ Prelims' },
  ]

  if (isGroup2) {
    aiItems.push({ to: '/notes', icon: FileText, label: 'Group 2 Notes' })
  } else {
    aiItems.push({ to: '/notes',     icon: BookOpen, label: 'Mains Notes' })
    aiItems.push({ to: '/evaluator', icon: Star,     label: 'Answer Evaluator' })
  }

  aiItems.push({ to: '/planner', icon: Calendar, label: 'Study Planner' })

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
        { to: '/history', icon: Clock,      label: 'Study History' },
        { to: '/pricing', icon: CreditCard, label: 'Plans & Pricing' },
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
        width: 272,
        background: 'var(--bg-soft)',
        borderRight: '1px solid var(--border-soft)',
        padding: '28px 22px',
      }}
    >
      {/* ── Mobile close ── */}
      {isMobile && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg"
          style={{ color: 'var(--text-3)' }}
        >
          <X size={16} />
        </button>
      )}

      {/* ── Brand ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 26 }}>
        <div
          style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(155deg, var(--gold-hi), var(--gold) 60%, #8a6e1c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 17,
            color: '#0A0F1C',
          }}
        >
          A
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 560, fontSize: 19, letterSpacing: 0.2 }}>
            APPSC <span style={{ color: 'var(--gold-hi)' }}>AI</span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>
            Ace with Ease IAS
          </div>
        </div>
      </div>

      {/* ── Exam Pill ── */}
      {user?.targetExam && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            border: '1px solid var(--border)', borderRadius: 10,
            padding: '11px 13px', marginBottom: 28,
            background: 'var(--surface)',
          }}
        >
          <div
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--indigo)',
              boxShadow: '0 0 0 3px var(--indigo-dim)',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
              {user.targetExam}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
              Prelims + Mains track
            </div>
          </div>
        </div>
      )}

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ section, items }) => (
          <div key={section} style={{ marginBottom: 8 }}>
            <p
              style={{
                fontSize: 10.5, letterSpacing: '0.11em', textTransform: 'uppercase',
                color: 'var(--text-3)', fontWeight: 600,
                margin: '20px 8px 10px',
              }}
            >
              {section}
            </p>
            {items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={isMobile ? onClose : undefined}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 9,
                  color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                  marginBottom: 2,
                  borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                  background: isActive ? 'var(--surface-elevated)' : 'transparent',
                  transition: 'all 0.15s ease',
                })}
                className={({ isActive }) => isActive ? '' : 'sidebar-nav-item'}
              >
                <Icon size={16} style={{ flexShrink: 0, opacity: 0.9 }} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── User Footer ── */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 18,
          borderTop: '1px solid var(--border-soft)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px' }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(160deg, #3A4A78, #232C4A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
              color: 'var(--text-1)', border: '1px solid var(--border)',
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || ''}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 9, marginTop: 4,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-3)', fontSize: 13, fontWeight: 500,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#F87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
