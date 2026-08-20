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
  ChevronLeft,
  Lock,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { useLanguage } from '../context/LanguageContext'
import BrandLogo from './BrandLogo'

// ─── Helper: derive nav from exam & plan ────────────────────────────────────
function getNavItems(targetExam = '', planTier = 'free', t = (k) => k) {
  const exam = (targetExam || '').toLowerCase()
  const isGroup2 = exam.includes('group 2')
  const plan = (planTier || 'free').toLowerCase()
  const isEvalLocked = !['pro_999', 'officer_1999', 'admin'].includes(plan)

  const moduleItems = [
    { to: '/prelims', icon: Sparkles, label: t('nav.prelims', 'MCQ Prelims') },
  ]

  if (isGroup2) {
    moduleItems.push({ to: '/notes', icon: FileText, label: t('nav.group2Notes', 'Notes') })
  } else {
    moduleItems.push({ to: '/notes',     icon: BookOpen, label: t('nav.mainsNotes', 'Notes') })
    moduleItems.push({
      to: '/evaluator',
      icon: Star,
      label: t('nav.evaluator', 'Answer Evaluator'),
      locked: isEvalLocked,
    })
  }

  moduleItems.push({ to: '/planner', icon: Calendar, label: t('nav.planner', 'Study Planner') })

  return [
    {
      section: t('nav.overview', 'Overview'),
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard', 'Dashboard') },
      ],
    },
    {
      section: t('nav.modules', 'Modules'),
      items: moduleItems,
    },
    {
      section: t('nav.account', 'Account'),
      items: [
        { to: '/history', icon: Clock,      label: t('nav.history', 'Study History') },
        { to: '/pricing', icon: CreditCard, label: t('nav.pricing', 'Plans & Pricing') },
      ],
    },
  ]
}

const Sidebar = ({ open, onClose, isMobile }) => {
  const { user, logout } = useAuthStore()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const NAV_ITEMS = getNavItems(user?.targetExam, user?.planTier || user?.plan_tier || 'free', t)

  if (!open) return null

  return (
    <aside
      className="fixed top-0 left-0 h-full z-40 flex flex-col"
      style={{
        width: 272,
        background: 'var(--bg-soft)',
        borderRight: '1px solid var(--border-soft)',
        padding: '24px 20px',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* ── Brand & Collapse Button ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 22 }}>
        <BrandLogo size={38} showText={true} textSize={20} />

        {/* Back / Collapse Button inside Sidebar */}
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-2)', cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Collapse sidebar"
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'var(--indigo)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <ChevronLeft size={17} />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ section, items }) => (
          <div key={section} style={{ marginBottom: 6 }}>
            <p
              style={{
                fontSize: 10.5, letterSpacing: '0.11em', textTransform: 'uppercase',
                color: 'var(--text-3)', fontWeight: 600,
                margin: '16px 8px 8px',
              }}
            >
              {section}
            </p>
            {items.map(({ to, icon: Icon, label, locked }) => (
              <NavLink
                key={to}
                to={to}
                onClick={isMobile ? onClose : undefined}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '9px 12px',
                  borderRadius: 9,
                  color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none',
                  marginBottom: 2,
                  borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                  background: isActive ? 'var(--surface-elevated)' : 'transparent',
                  transition: 'all 0.15s ease',
                })}
              >
                <Icon size={16} style={{ flexShrink: 0, opacity: 0.9 }} />
                <span>{label}</span>
                {locked && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 9.5,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 5,
                      background: 'var(--gold-dim)',
                      color: 'var(--gold-hi)',
                      border: '1px solid var(--gold-border)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <Lock size={9} /> PRO
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── User Footer ── */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 14,
          borderTop: '1px solid var(--border-soft)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px' }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--indigo), #4338CA)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              color: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
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
            padding: '8px 12px', borderRadius: 9, marginTop: 4,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-3)', fontSize: 13, fontWeight: 500,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.color = 'var(--red)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
        >
          <LogOut size={14} />
          <span>{t('nav.signOut', 'Sign Out')}</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
