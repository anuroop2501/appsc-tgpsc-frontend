import { useState, useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Menu, Bell, ChevronRight, CheckCircle, Info, Calendar } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useBreadcrumbStore from '../store/breadcrumbStore'
import PricingModal from './PricingModal'
import { getUserBalance } from '../api/payment'

const getRouteLabels = (targetExam = '') => {
  const isGroup2 = (targetExam || '').toLowerCase().includes('group 2')
  return {
    '/dashboard':  ['Dashboard'],
    '/prelims':    ['AI Tools', 'MCQ Prelims'],
    '/test':       ['AI Tools', 'Mock Test'],
    '/notes':      ['AI Tools', isGroup2 ? 'Group 2 Notes' : 'Mains Notes'],
    '/evaluator':  ['AI Tools', 'Answer Evaluator'],
    '/planner':    ['AI Tools', 'Study Planner'],
    '/history':    ['Account', 'Study History'],
  }
}

const CRUMB_PATHS = {
  'Dashboard': '/dashboard',
  'AI Tools':  '/dashboard',
  'Account':   '/dashboard',
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
    title: 'AI Vision OCR Configured',
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

const Topbar = ({ onMenuClick }) => {
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const [credits, setCredits] = useState(user?.credits || 0)
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unread, setUnread] = useState(true)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const dropdownRef = useRef(null)

  // Fetch live credits on mount
  useEffect(() => {
    if (user?.id || user?.userId) {
      getUserBalance()
        .then((data) => { if (data.credits !== undefined) setCredits(data.credits) })
        .catch(() => {})
    }
  }, [user])

  const override = useBreadcrumbStore((s) => s.override)
  const ROUTE_LABELS = getRouteLabels(user?.targetExam)
  const crumbs = override || ROUTE_LABELS[pathname] || [pathname.slice(1)]

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  // Close on outside click
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
        padding: '0 40px',
        background: 'var(--bg-soft)',
        borderBottom: '1px solid var(--border-soft)',
        height: 64,
      }}
    >
      {/* ── Left: hamburger + breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onMenuClick}
          style={{
            padding: '6px', borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer', color: 'var(--text-3)',
            display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            const path = CRUMB_PATHS[crumb]
            return (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <ChevronRight size={12} style={{ color: 'var(--text-3)' }} />}
                {isLast || !path ? (
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}>
                    {crumb}
                  </span>
                ) : (
                  <Link
                    to={path}
                    style={{ fontSize: 13.5, color: 'var(--text-3)', textDecoration: 'none', fontWeight: 500 }}
                  >
                    {crumb}
                  </Link>
                )}
              </span>
            )
          })}
        </nav>
      </div>

      {/* ── Right: credits + bell + avatar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }} ref={dropdownRef}>

        {/* Credits Pill */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface)', borderRadius: 10,
            padding: '7px 8px 7px 14px',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 600, color: 'var(--gold-hi)' }}>
              {credits.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Credits
            </div>
          </div>
          <button
            onClick={() => setIsPricingOpen(true)}
            style={{
              background: 'var(--gold-dim)', color: 'var(--gold-hi)',
              border: '1px solid var(--gold-border)',
              fontSize: 11.5, fontWeight: 600, padding: '5px 10px',
              borderRadius: 7, cursor: 'pointer',
            }}
          >
            Top up
          </button>
        </div>

        {/* Bell */}
        <button
          onClick={handleBellClick}
          style={{
            width: 38, height: 38, borderRadius: 10,
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
              position: 'absolute', right: 0, top: 50,
              width: 320, borderRadius: 12, overflow: 'hidden', zIndex: 50,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
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
            background: 'linear-gradient(160deg, #3A4A78, #232C4A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
            color: 'var(--text-1)', border: '1px solid var(--border)', cursor: 'pointer',
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
