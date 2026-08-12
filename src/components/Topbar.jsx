import { useState, useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Menu, Bell, ChevronRight, CheckCircle, Info, Calendar, Zap, Sun, Moon } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useBreadcrumbStore from '../store/breadcrumbStore'
import { useTheme } from '../context/ThemeContext'
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
    '/history':    ['Dashboard', 'Study History'],
  }
}

const CRUMB_PATHS = {
  'Dashboard': '/dashboard',
  'AI Tools': '/dashboard',
  'Account': '/dashboard',
  'Study History': '/history',
}

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Knowledge Base Ready',
    desc: '36,526 study chunks loaded successfully. Dynamic RAG search active.',
    time: 'Just now',
    type: 'info',
    icon: CheckCircle,
    color: '#3DD68C',
  },
  {
    id: 2,
    title: 'AI Vision OCR Configured',
    desc: 'You can now upload scanner sheets or hand-written PDFs directly.',
    time: '2 hours ago',
    type: 'success',
    icon: Info,
    color: '#4F8EF7',
  },
  {
    id: 3,
    title: 'Welcome to APPSC AI',
    desc: 'Complete your profile setup and select your focus subjects.',
    time: '1 day ago',
    type: 'system',
    icon: Calendar,
    color: '#7B5EF8',
  },
]

const Topbar = ({ onMenuClick }) => {
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

  // Fetch live credits on mount
  useEffect(() => {
    if (user?.id || user?.userId) {
      getUserBalance()
        .then((data) => {
          if (data.credits !== undefined) {
            setCredits(data.credits)
          }
        })
        .catch(() => {})
    }
  }, [user])

  const override = useBreadcrumbStore((s) => s.override)
  const ROUTE_LABELS = getRouteLabels(user?.targetExam)
  const crumbs = override || ROUTE_LABELS[pathname] || [pathname.slice(1)]

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  // Close notifications dropdown on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleBellClick = () => {
    setShowNotifications((s) => !s)
    setUnread(false)
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-6 py-3"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        height: 60,
      }}
    >
      {/* ── Left: menu + breadcrumb ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors lg:hidden"
          style={{ color: 'var(--color-text)' }}
        >
          <Menu size={20} />
        </button>
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors hidden lg:block"
          style={{ color: 'var(--color-muted)' }}
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            const path = CRUMB_PATHS[crumb]

            return (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <ChevronRight size={13} style={{ color: 'var(--color-muted)' }} />
                )}
                {isLast || !path ? (
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: 'var(--color-text)',
                      fontFamily: 'Sora, sans-serif',
                    }}
                  >
                    {crumb}
                  </span>
                ) : (
                  <Link
                    to={path}
                    className="text-sm font-medium transition-colors hover:text-white"
                    style={{
                      color: 'var(--color-muted)',
                      fontFamily: 'DM Sans, sans-serif',
                      textDecoration: 'none',
                    }}
                  >
                    {crumb}
                  </Link>
                )}
              </span>
            )
          })}
        </nav>
      </div>

      {/* ── Right: credits + notifications + avatar ── */}
      <div className="flex items-center gap-3 relative" ref={dropdownRef}>
        {/* Credit Balance Pill Button */}
        <button
          onClick={() => setIsPricingOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
          style={{
            background: 'rgba(79, 142, 247, 0.12)',
            border: '1px solid rgba(79, 142, 247, 0.3)',
            color: 'var(--color-accent)',
          }}
          title="Click to view plans & credit top-ups"
        >
          <Zap size={14} style={{ color: '#F5A623' }} />
          <span>{credits} Cr</span>
          <span
            className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase"
            style={{ background: 'linear-gradient(135deg, #4F8EF7, #7B5EF8)', color: '#FFFFFF' }}
          >
            + Top Up
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center"
          style={{ color: 'var(--color-muted)' }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={18} className="text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon size={18} className="text-indigo-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Bell */}
        <button
          onClick={handleBellClick}
          className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: 'var(--color-muted)' }}
        >
          <Bell size={18} />
          {unread && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse"
              style={{ background: 'var(--color-accent)' }}
            />
          )}
        </button>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div
            className="absolute right-0 top-12 w-80 rounded-xl overflow-hidden z-50 animate-slide-down"
            style={{
              background: 'rgba(19, 24, 38, 0.98)',
              border: '1px solid var(--color-border)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
                Notifications
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-[10px] font-semibold hover:opacity-80"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-border/30">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs" style={{ color: 'var(--color-muted)' }}>
                  No new notifications
                </div>
              ) : (
                notifications.map((n) => {
                  const IconComponent = n.icon
                  return (
                    <div key={n.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-start gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${n.color}15` }}
                      >
                        <IconComponent size={14} style={{ color: n.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text)' }}>
                          {n.title}
                        </p>
                        <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: 'var(--color-muted)' }}>
                          {n.desc}
                        </p>
                        <span className="text-[9px] mt-1.5 block" style={{ color: 'var(--color-muted)' }}>
                          {n.time}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Avatar + name */}
        <div className="flex items-center gap-2.5 pl-2 border-l" style={{ borderColor: 'var(--color-border)' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #4F8EF7, #7B5EF8)' }}
          >
            {initials}
          </div>
          <div className="hidden sm:block">
            <p
              className="text-sm font-semibold leading-none"
              style={{ color: 'var(--color-text)', fontFamily: 'Sora, sans-serif' }}
            >
              {user?.name?.split(' ')[0] || 'User'}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'var(--color-muted)' }}
            >
              {user?.targetExam || 'Student'}
            </p>
          </div>
        </div>
      </div>

      {/* Pricing & Credit Upgrade Modal */}
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
