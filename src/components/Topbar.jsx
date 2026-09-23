import { useState, useEffect, useRef } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import {
  Menu,
  ChevronRight,
  CheckCircle,
  Info,
  Calendar,
  Sun,
  Moon,
  Languages,
  Zap,
  Bell,
  LogOut,
  User,
  CreditCard,
  History,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import useBreadcrumbStore from '../store/breadcrumbStore'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import PricingModal from './PricingModal'
import { getUserBalance } from '../api/payment'

const getRouteLabels = (targetExam = '', t = (k) => k) => {
  const isGroup2 = (targetExam || '').toLowerCase().includes('group 2')
  return {
    '/dashboard':  [t('nav.dashboard', 'Dashboard')],
    '/prelims':    [t('nav.modules', 'Modules'), t('nav.prelims', 'MCQ Prelims')],
    '/test':       [t('nav.modules', 'Modules'), t('nav.mockTest', 'Mock Test')],
    '/notes':      [t('nav.modules', 'Modules'), isGroup2 ? t('nav.group2Notes', 'Notes') : t('nav.mainsNotes', 'Notes')],
    '/evaluator':  [t('nav.modules', 'Modules'), t('nav.evaluator', 'Answer Evaluator')],
    '/planner':    [t('nav.modules', 'Modules'), t('nav.planner', 'Study Planner')],
    '/history':    [t('nav.account', 'Account'), t('nav.history', 'Study History')],
    '/pricing':    [t('nav.account', 'Account'), t('nav.pricing', 'Plans & Pricing')],
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
    desc: '36,526 study chunks loaded. Knowledge search active.',
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
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const updateUser = useAuthStore((s) => s.updateUser)
  const setCredits = useAuthStore((s) => s.setCredits)
  const { theme, toggleTheme } = useTheme()
  const { language, toggleLanguage, t } = useLanguage()
  const credits = user?.credits ?? 0
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [unread, setUnread] = useState(true)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (user?.id || user?.userId) {
      getUserBalance()
        .then((data) => {
          if (data.credits !== undefined && setCredits) setCredits(data.credits)
        })
        .catch(() => {})
    }
  }, [user?.id, user?.userId, setCredits])

  const override = useBreadcrumbStore((s) => s.override)
  const clearOverride = useBreadcrumbStore((s) => s.clearOverride)

  useEffect(() => {
    clearOverride()
  }, [pathname, clearOverride])

  const ROUTE_LABELS = getRouteLabels(user?.targetExam, t)
  const crumbs = override || ROUTE_LABELS[pathname] || [pathname.slice(1)]

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false)
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleBellClick = () => {
    setShowNotifications((s) => !s)
    setShowUserMenu(false)
    setUnread(false)
  }

  const handleAvatarClick = () => {
    setShowUserMenu((s) => !s)
    setShowNotifications(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(12px, 3vw, 28px)',
        background: 'var(--bg-soft)',
        borderBottom: '1px solid var(--border-soft)',
        height: 64,
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* ── Left: hamburger button (when sidebar collapsed) + breadcrumb / title ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1, marginRight: 8 }}>
        {!sidebarOpen && (
          <button
            onClick={onMenuClick}
            style={{
              padding: '8px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface)', cursor: 'pointer', color: 'var(--text-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            title="Open sidebar"
          >
            <Menu size={18} />
          </button>
        )}

        {/* Breadcrumb / Page Title */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            const path = CRUMB_PATHS[crumb]
            return (
              <span key={i} className={!isLast ? 'hidden md:flex items-center gap-1.5' : 'flex items-center gap-1.5 min-w-0'}>
                {i > 0 && <ChevronRight size={13} className="hidden md:inline" style={{ color: 'var(--text-3)', flexShrink: 0 }} />}
                {isLast || !path ? (
                  <span style={{ fontSize: 'clamp(15px, 2.5vw, 17px)', fontWeight: 650, color: 'var(--text-1)', fontFamily: 'var(--font-body)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

      {/* ── Right Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', flexShrink: 0 }} ref={dropdownRef}>

        {/* Desktop Credits Box */}
        <div
          className="hidden md:flex"
          style={{
            alignItems: 'center', gap: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface)', borderRadius: 10,
            padding: '4px 6px 4px 10px',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--gold-hi)' }}>
              {credits.toLocaleString()}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('nav.credits', 'Credits')}
            </div>
          </div>
          <button
            onClick={() => setIsPricingOpen(true)}
            style={{
              background: 'var(--gold-dim)', color: 'var(--gold-hi)',
              border: '1px solid var(--gold-border)',
              fontSize: 11, fontWeight: 600, padding: '3px 8px',
              borderRadius: 6, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t('nav.topUp', 'Top up')}
          </button>
        </div>

        {/* Mobile Compact Credit Pill (Tap to Top Up) */}
        <button
          onClick={() => setIsPricingOpen(true)}
          className="flex md:hidden"
          style={{
            alignItems: 'center', gap: 5,
            border: '1px solid var(--gold-border)',
            background: 'var(--gold-dim)', borderRadius: 9,
            padding: '5px 9px', cursor: 'pointer',
          }}
          title="Tap to recharge AI credits"
        >
          <Zap size={13} style={{ color: 'var(--gold-hi)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 700, color: 'var(--gold-hi)' }}>
            {credits >= 10000 ? `${(credits / 1000).toFixed(1)}k` : credits.toLocaleString()}
          </span>
        </button>

        {/* Desktop Telugu / English Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="hidden md:flex"
          style={{
            height: 34,
            padding: '0 8px',
            borderRadius: 9,
            border: language === 'te' ? '1px solid var(--gold-border)' : '1px solid var(--border)',
            background: language === 'te' ? 'var(--gold-dim)' : 'var(--surface)',
            alignItems: 'center',
            gap: 5,
            cursor: 'pointer',
            color: language === 'te' ? 'var(--gold-hi)' : 'var(--text-2)',
            transition: 'all 0.18s ease',
            fontSize: 12.5,
            fontWeight: 650,
            userSelect: 'none',
          }}
          title={language === 'te' ? 'Switch to English' : 'తెలుగులోకి మార్చండి (Switch to Telugu)'}
        >
          <Languages size={14} style={{ opacity: 0.9 }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: language === 'te' ? 12 : 11.5 }}>
            {language === 'te' ? 'తెలుగు' : 'English'}
          </span>
          <span
            style={{
              fontSize: 9,
              padding: '1px 4px',
              borderRadius: 4,
              background: language === 'te' ? 'var(--gold)' : 'var(--surface-elevated)',
              color: language === 'te' ? '#0A0D16' : 'var(--text-3)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {language === 'te' ? 'TE' : 'EN'}
          </span>
        </button>

        {/* Desktop Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="hidden md:flex"
          style={{
            width: 34, height: 34, borderRadius: 9,
            border: '1px solid var(--border)', background: 'var(--surface)',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-2)',
            transition: 'all 0.15s ease',
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={15} style={{ color: 'var(--gold-hi)' }} />
          ) : (
            <Moon size={15} style={{ color: 'var(--indigo)' }} />
          )}
        </button>

        {/* Bell / Notifications (Always Visible) */}
        <button
          onClick={handleBellClick}
          style={{
            width: 34, height: 34, borderRadius: 9,
            border: '1px solid var(--border)', background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', cursor: 'pointer', color: 'var(--text-2)',
            flexShrink: 0,
          }}
          title="Notifications"
        >
          <Bell size={15} />
          {unread && (
            <span
              style={{
                position: 'absolute', top: 7, right: 7,
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--gold)',
              }}
            />
          )}
        </button>

        {/* Avatar Chip (Tapping opens quick user menu) */}
        <button
          onClick={handleAvatarClick}
          style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--indigo), #4338CA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            color: '#ffffff', border: '1px solid var(--border)', cursor: 'pointer',
            padding: 0,
          }}
          title="Account Menu"
        >
          {initials}
        </button>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div
            className="animate-slide-down"
            style={{
              position: 'absolute', right: 0, top: 46,
              width: 'min(320px, calc(100vw - 32px))', borderRadius: 12, overflow: 'hidden', zIndex: 50,
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

        {/* User Profile & Quick Settings Dropdown */}
        {showUserMenu && (
          <div
            className="animate-slide-down"
            style={{
              position: 'absolute', right: 0, top: 46,
              width: 'min(280px, calc(100vw - 32px))', borderRadius: 12, overflow: 'hidden', zIndex: 50,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            }}
          >
            {/* User Info Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-soft)', background: 'var(--surface-elevated)' }}>
              <div style={{ fontSize: 13.5, fontWeight: 650, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Student Account'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                {user?.email || 'Logged in'}
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold-hi)', background: 'var(--gold-dim)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--gold-border)' }}>
                  {credits.toLocaleString()} Credits
                </span>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    setIsPricingOpen(true)
                  }}
                  style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--indigo)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  + Top up
                </button>
              </div>
            </div>

            {/* Quick Actions (Especially useful on Mobile) */}
            <div style={{ padding: '6px' }}>
              {/* Language Switcher */}
              <button
                onClick={() => {
                  toggleLanguage()
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', borderRadius: 8, background: 'transparent', border: 'none',
                  cursor: 'pointer', color: 'var(--text-2)', fontSize: 13,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-elevated)'; e.currentTarget.style.color = 'var(--text-1)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Languages size={15} style={{ color: 'var(--gold-hi)' }} />
                  <span>Medium / భాష</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: language === 'te' ? 'var(--gold-dim)' : 'var(--surface-elevated)', color: language === 'te' ? 'var(--gold-hi)' : 'var(--text-3)' }}>
                  {language === 'te' ? 'తెలుగు' : 'English'}
                </span>
              </button>

              {/* Theme Switcher */}
              <button
                onClick={() => {
                  toggleTheme()
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', borderRadius: 8, background: 'transparent', border: 'none',
                  cursor: 'pointer', color: 'var(--text-2)', fontSize: 13,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-elevated)'; e.currentTarget.style.color = 'var(--text-1)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {theme === 'dark' ? <Sun size={15} style={{ color: 'var(--gold-hi)' }} /> : <Moon size={15} style={{ color: 'var(--indigo)' }} />}
                  <span>Display Theme</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>

              {/* Plans & Pricing */}
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  navigate('/pricing')
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, background: 'transparent', border: 'none',
                  cursor: 'pointer', color: 'var(--text-2)', fontSize: 13,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-elevated)'; e.currentTarget.style.color = 'var(--text-1)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' }}
              >
                <CreditCard size={15} style={{ color: 'var(--indigo)' }} />
                <span>Plans & Upgrades</span>
              </button>

              {/* Study History */}
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  navigate('/history')
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, background: 'transparent', border: 'none',
                  cursor: 'pointer', color: 'var(--text-2)', fontSize: 13,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-elevated)'; e.currentTarget.style.color = 'var(--text-1)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' }}
              >
                <History size={15} style={{ color: 'var(--emerald)' }} />
                <span>Study History</span>
              </button>

              <div style={{ height: 1, background: 'var(--border-soft)', margin: '4px 0' }} />

              {/* Sign Out */}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, background: 'transparent', border: 'none',
                  cursor: 'pointer', color: 'var(--red)', fontSize: 13, fontWeight: 500,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-dim)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
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
