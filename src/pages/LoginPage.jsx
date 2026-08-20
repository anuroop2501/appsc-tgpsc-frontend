import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { login } from '../api/auth'
import useAuthStore from '../store/authStore'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const token = useAuthStore((s) => s.token)
  const setAuth = useAuthStore((s) => s.setAuth)

  const from = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (token) navigate(from, { replace: true })
  }, [token, navigate, from])

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    setError('')
    try {
      const data = await login(form)
      setAuth({ user: data.user, token: data.token || data.accessToken, refreshToken: data.refreshToken })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'var(--bg)',
      }}
    >
      {/* Subtle ambient glows */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,130,232,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,164,48,0.06) 0%, transparent 70%)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', animation: 'fadeIn 0.4s ease forwards' }}>
        {/* Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '40px 36px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: 13, marginBottom: 16,
                background: 'linear-gradient(155deg, var(--gold-hi), var(--gold) 60%, #8a6e1c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 20, color: '#0A0F1C',
              }}
            >
              A
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 560, fontSize: 22, margin: 0 }}>
              APPSC <span style={{ color: 'var(--gold-hi)' }}>AI</span>
            </h1>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4, letterSpacing: '0.04em' }}>
              AI-powered APPSC preparation by Ace with Ease IAS
            </p>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 560, fontSize: 24, margin: '0 0 4px', color: 'var(--text-1)' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--text-2)', margin: 0 }}>
              Sign in to continue your preparation
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10, marginBottom: 18,
                background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)',
                color: 'var(--red)', fontSize: 13.5,
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input
                  type="email" name="email" value={form.email} onChange={handle}
                  placeholder="you@example.com" autoComplete="email"
                  className="input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input
                  type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handle}
                  placeholder="••••••••" autoComplete="current-password"
                  className="input"
                  style={{ paddingLeft: 38, paddingRight: 40 }}
                />
                <button
                  type="button" onClick={() => setShowPass((s) => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2 }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="btn-primary"
              style={{ width: '100%', height: 46, marginTop: 6, fontSize: 15 }}
            >
              {loading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>New to APPSC AI?</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <Link
            to="/signup"
            style={{
              display: 'block', width: '100%', textAlign: 'center',
              padding: '11px 0', borderRadius: 11,
              border: '1px solid var(--border)',
              color: 'var(--indigo)', fontSize: 13.5, fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-elevated)'; e.currentTarget.style.borderColor = 'var(--indigo-border)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            Create an account
          </Link>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-3)', marginTop: 16 }}>
          Ace with Ease IAS — Powered by Precision AI
        </p>
      </div>
    </div>
  )
}

export default LoginPage
