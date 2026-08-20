import { useState, useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Menu, ChevronLeft, Bell, ChevronRight, CheckCircle, Info, Calendar, Sun, Moon } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useBreadcrumbStore from '../store/breadcrumbStore'
import { useTheme } from '../context/ThemeContext'
import PricingModal from './PricingModal'
import { getUserBalance } from '../api/payment'

const getRouteLabels = (targetExam = '') => {
  const isGroup2 = (targetExam || '').toLowerCase().includes('group 2')
  return {
    '/dashboard':  ['Dashboard'],
    '/prelims':    ['Modules', 'MCQ Prelims'],
    '/test':       ['Modules', 'Mock Test'],
    '/notes':      ['Modules', isGroup2 ? 'Group 2 Notes' : 'Mains Notes'],
    '/evaluator':  ['Modules', 'Answer Evaluator'],
    '/planner':    ['Modules', 'Study Planner'],
    '/history':    ['Account', 'Study History'],
    '/pricing':    ['Account', 'Plans & Pricing'],
  }
}

const CRUMB_PATHS = {
  'Dashboard': '/dashboard',
  'Modules':   '/dashboard',
  'Account':   '/dashboard',
  'Study History': '/history',
}

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Knowledge Base Ready',
    desc: '36,526 study chunks loaded. Dynamic RAG search active.',
    time: 'Just now',
    icon: CheckCircle,
    color: 'var(--emerald)',
  },
  {
    id: 2,
    title: 'Vision OCR Configured',
    desc: 'Upload scanned sheets or hand-written PDFs directly.',
    time: '2 hours ago',
    icon: Info,
    color: 'var(--indigo)',
  },
  {
    id: 3,
    title: 'Welcome to APPSC AI',
    desc: 'Complete your profile and select your focus subjects.',
    time: '1 day ago',
    icon: Calendar,
    color: 'var(--gold)',
  },
]

const Topbar = ({ onMenuClick, sidebarOpen = true }) => {
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const { theme, toggleTheme } = useTheme()
  const [credits, setCredits] = useState(user?.credits || 0)
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unread, setUnread] = useState(true)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (user?.id || user?.userId) {
      getUserBalance()
        .then((data) => { if (data.credits !== undefined) setCredits(data.credits) })
        .catch(() => {})
    }
  }, [user])

  const override = useBreadcrumbStore((s) => s.override)
  const clearOverride = useBreadcrumbStore((s) => s.clearOverride)

  useEffect(() => {
    clearOverride()
  }, [pathname, clearOverride])

  const ROUTE_LABELS = getRouteLabels(user?.targetExam)
  const crumbs = override || ROUTE_LABELS[pathname] || [pathname.slice(1)]

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleBellClick = () => {
    setShowNotifications((s) => !s)
    setUnread(false)
  }

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        background: 'var(--bg-soft)',
        borderBottom: '1px solid var(--border-soft)',
        height: 64,
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* ── Left: hamburger button (when sidebar collapsed) + breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
        {!sidebarOpen && (
          <button
            onClick={onMenuClick}
            style={{
              padding: '7px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface)', cursor: 'pointer', color: 'var(--text-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            title="Open sidebar"
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'var(--indigo)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <Menu size={18} />
          </button>
        )}

        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            const path = CRUMB_PATHS[crumb]
            return (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                {i > 0 && <ChevronRight size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />}
                {isLast || !path ? (
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 380 }}>
                    {crumb}
                  </span>
                ) : (
                  <Link
                    to={path}
                    style={{ fontSize: 13.5, color: 'var(--text-3)', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}
                  >
                    {crumb}
                  </Link>
                )}
              </span>
            )
          })}
        </nav>
      </div>

      {/* ── Right: credits + theme toggle + bell + avatar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', flexShrink: 0 }} ref={dropdownRef}>

        {/* Credits Pill */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface)', borderRadius: 10,
            padding: '6px 8px 6px 12px',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 600, color: 'var(--gold-hi)' }}>
              {credits.toLocaleString()}
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Credits
            </div>
          </div>
          <button
            onClick={() => setIsPricingOpen(true)}
            style={{
              background: 'var(--gold-dim)', color: 'var(--gold-hi)',
              border: '1px solid var(--gold-border)',
              fontSize: 11.5, fontWeight: 600, padding: '4px 9px',
              borderRadius: 7, cursor: 'pointer',
            }}
          >
            Top up
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-2)',
            transition: 'all 0.15s ease',
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={16} style={{ color: 'var(--gold-hi)' }} />
          ) : (
            <Moon size={16} style={{ color: 'var(--indigo)' }} />
          )}
        </button>

        {/* Bell */}
        <button
          onClick={handleBellClick}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', cursor: 'pointer', color: 'var(--text-2)',
          }}
        >
          <Bell size={16} />
          {unread && (
            <span
              style={{
                position: 'absolute', top: 8, right: 8,
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--gold)',
              }}
            />
          )}
        </button>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div
            className="animate-slide-down"
            style={{
              position: 'absolute', right: 0, top: 48,
              width: 320, borderRadius: 12, overflow: 'hidden', zIndex: 50,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-soft)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-1)' }}>
                Notifications
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={() => setNotifications([])}
                  style={{ fontSize: 11, color: 'var(--indigo)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear all
                </button>
              )}
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
                  No new notifications
                </div>
              ) : (
                notifications.map((n) => {
                  const IconComponent = n.icon
                  return (
                    <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border-soft)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${n.color}22` }}>
                        <IconComponent size={13} style={{ color: n.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>{n.title}</p>
                        <p style={{ fontSize: 11.5, color: 'var(--text-2)', margin: '3px 0 0', lineHeight: 1.4 }}>{n.desc}</p>
                        <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, display: 'block' }}>{n.time}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Avatar chip */}
        <div
          style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--indigo), #4338CA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            color: '#ffffff', border: '1px solid var(--border)', cursor: 'pointer',
          }}
        >
          {initials}
        </div>
      </div>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        onPaymentSuccess={(updatedUser) => {
          if (updatedUser?.credits !== undefined) {
            setCredits(updatedUser.credits)
            if (updateUser) updateUser(updatedUser)
          }
        }}
      />
    </header>
  )
}

export default Topbar
