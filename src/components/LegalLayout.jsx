import { NavLink, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, Shield, FileText, RotateCcw, Moon, Sun } from 'lucide-react'
import BrandLogo from './BrandLogo'
import Footer from './Footer'
import { useTheme } from '../context/ThemeContext'
import useAuthStore from '../store/authStore'

export default function LegalLayout({ children, title, subtitle, lastUpdated = 'August 21, 2026' }) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const token = useAuthStore((s) => s.token)

  const handlePrint = () => {
    window.print()
  }

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1)
    } else {
      navigate(token ? '/dashboard' : '/login')
    }
  }

  const navTabs = [
    { to: '/privacy-policy', label: 'Privacy Policy', icon: Shield },
    { to: '/terms-and-conditions', label: 'Terms & Conditions', icon: FileText },
    { to: '/refund-policy', label: 'Refund & Cancellation', icon: RotateCcw },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Header Bar ── */}
      <header
        style={{
          borderBottom: '1px solid var(--border-soft)',
          background: 'var(--bg-soft)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={handleBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-2)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'var(--indigo)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>

            <NavLink to={token ? '/dashboard' : '/login'} style={{ textDecoration: 'none' }}>
              <BrandLogo size={32} showText={true} textSize={18} />
            </NavLink>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-2)',
                fontSize: 12.5,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Print document"
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)' }}
            >
              <Printer size={14} />
              <span>Print</span>
            </button>

            <button
              onClick={toggleTheme}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, maxWidth: 940, width: '100%', margin: '0 auto', padding: '36px 20px 60px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 11.5,
              fontWeight: 600,
              background: 'var(--indigo-dim)',
              color: 'var(--indigo)',
              border: '1px solid var(--indigo-border)',
              marginBottom: 12,
            }}
          >
            Legal Information &amp; User Agreements
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 34,
              fontWeight: 700,
              color: 'var(--text-1)',
              margin: '0 0 10px',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 14.5, color: 'var(--text-2)', margin: '0 0 12px', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
              {subtitle}
            </p>
          )}
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Last Updated: <strong style={{ color: 'var(--text-2)' }}>{lastUpdated}</strong> · Official Policy of APPSC AI
          </div>
        </div>

        {/* Legal Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 36,
            flexWrap: 'wrap',
          }}
        >
          {navTabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                background: isActive ? 'var(--surface-elevated)' : 'var(--surface)',
                color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                border: isActive ? '1px solid var(--indigo-border)' : '1px solid var(--border)',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={15} style={{ opacity: 0.9 }} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Document Body Card */}
        <main
          className="card"
          style={{
            padding: '40px 36px',
            boxShadow: 'var(--shadow-elevated)',
            lineHeight: 1.7,
            fontSize: 14.5,
            color: 'var(--text-2)',
          }}
        >
          {children}
        </main>

        {/* Comprehensive Footer */}
        <Footer />
      </div>
    </div>
  )
}
