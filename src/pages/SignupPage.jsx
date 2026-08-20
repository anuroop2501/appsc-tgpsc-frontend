import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, User, GraduationCap, Loader2 } from 'lucide-react'
import { signup } from '../api/auth'
import useAuthStore from '../store/authStore'
import BrandLogo from '../components/BrandLogo'

const EXAMS = [
  { value: 'APPSC Group 1', label: 'APPSC Group 1' },
  { value: 'APPSC Group 2', label: 'APPSC Group 2' },
]

const SignupPage = () => {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const setAuth = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  const [form, setForm] = useState({ name: '', email: '', password: '', targetExam: 'APPSC Group 1' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = (e) => { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); setError('') }

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.'
    if (!form.email.trim()) return 'Email is required.'
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email.'
    if (form.password.length < 6) return 'Password must be at least 6 characters.'
    return null
  }

  const submit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError('')
    try {
      const data = await signup(form)
      setAuth({ user: data.user, token: data.token || data.accessToken, refreshToken: data.refreshToken })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Signup failed. Please try again.')
    } finally { setLoading(false) }
  }

  const Field = ({ label, icon: Icon, children }) => (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', zIndex: 1 }} />
        {children}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'var(--bg)' }}>
      {/* Ambient glows */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,164,48,0.07) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,130,232,0.07) 0%, transparent 70%)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', animation: 'fadeIn 0.4s ease forwards' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '40px 36px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
            <div style={{ marginBottom: 14 }}>
              <BrandLogo size={52} showText={false} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 24, margin: 0, letterSpacing: 0.2 }}>
              APPSC{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #FF7A00 0%, #FF5500 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                }}
              >
                AI
              </span>
            </h1>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4, letterSpacing: '0.04em' }}>
              AI-Powered Preparation Platform for APPSC
            </p>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 560, fontSize: 24, margin: '0 0 4px', color: 'var(--text-1)' }}>
              Create your account
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--text-2)', margin: 0 }}>
              Join thousands of aspirants preparing smarter
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 13.5 }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Full Name" icon={User}>
              <input type="text" name="name" value={form.name} onChange={handle} placeholder="Ravi Kumar" autoComplete="name" className="input" style={{ paddingLeft: 38 }} />
            </Field>

            <Field label="Email address" icon={Mail}>
              <input type="email" name="email" value={form.email} onChange={handle} placeholder="you@example.com" autoComplete="email" className="input" style={{ paddingLeft: 38 }} />
            </Field>

            <Field label="Password" icon={Lock}>
              <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handle} placeholder="Minimum 6 characters" autoComplete="new-password" className="input" style={{ paddingLeft: 38, paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPass((s) => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2 }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </Field>

            <Field label="Target Exam" icon={GraduationCap}>
              <select name="targetExam" value={form.targetExam} onChange={handle} className="input select" style={{ paddingLeft: 38 }}>
                {EXAMS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </Field>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', height: 46, marginTop: 6, fontSize: 15 }}>
              {loading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Already have an account?</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <Link to="/login" style={{ display: 'block', width: '100%', textAlign: 'center', padding: '11px 0', borderRadius: 11, border: '1px solid var(--border)', color: 'var(--indigo)', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-elevated)'; e.currentTarget.style.borderColor = 'var(--indigo-border)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            Sign in instead
          </Link>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-3)', marginTop: 16 }}>
          By signing up, you agree to our Terms &amp; Privacy Policy
        </p>
      </div>
    </div>
  )
}

export default SignupPage
