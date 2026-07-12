import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Zap,
  AlertCircle,
  User,
  GraduationCap,
  Loader2,
} from 'lucide-react'
import { signup } from '../api/auth'
import useAuthStore from '../store/authStore'

const EXAMS = [
  { value: 'APPSC Group 1', label: 'APPSC Group 1' },
  { value: 'APPSC Group 2', label: 'APPSC Group 2' },
  { value: 'TGPSC Group 1', label: 'TGPSC Group 1' },
  { value: 'TGPSC Group 2', label: 'TGPSC Group 2' },
]

const SignupPage = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    targetExam: 'APPSC Group 1',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

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

    setLoading(true)
    setError('')
    try {
      const data = await signup(form)
      setAuth({
        user: data.user,
        token: data.token || data.accessToken,
        refreshToken: data.refreshToken,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Signup failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-10"
      style={{
        background:
          'radial-gradient(ellipse at top right, rgba(123,94,248,0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom left, rgba(79,142,247,0.12) 0%, transparent 50%), #0B0F1A',
      }}
    >
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--color-purple)' }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--color-accent)' }}
        />
      </div>

      <div
        className="relative w-full max-w-md animate-slide-up"
        style={{ animationDuration: '0.5s' }}
      >
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(26, 32, 53, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          {/* ── Logo ── */}
          <div className="flex flex-col items-center mb-7">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{
                background: 'linear-gradient(135deg, #7B5EF8, #4F8EF7)',
                boxShadow: '0 8px 24px rgba(123, 94, 248, 0.4)',
              }}
            >
              <Zap size={26} className="text-white" />
            </div>
            <h1
              className="text-2xl font-bold"
              style={{
                fontFamily: 'Sora, sans-serif',
                background: 'linear-gradient(135deg, #7B5EF8, #4F8EF7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ExamEdge
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              Start your AI-powered exam journey
            </p>
          </div>

          {/* ── Heading ── */}
          <div className="mb-6">
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}
            >
              Create your account
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              Join thousands of aspirants preparing smarter
            </p>
          </div>

          {/* ── Error ── */}
          {error && (
            <div
              className="flex items-center gap-2.5 p-3 rounded-xl mb-5 text-sm animate-slide-down"
              style={{
                background: 'rgba(247, 111, 111, 0.1)',
                border: '1px solid rgba(247, 111, 111, 0.3)',
                color: 'var(--color-red)',
              }}
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={submit} className="space-y-4">
            {/* Name */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text)' }}
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }}>
                  <User size={16} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handle}
                  placeholder="Ravi Kumar"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text)' }}
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }}>
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handle}
                  placeholder="you@example.com"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text)' }}
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }}>
                  <Lock size={16} />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handle}
                  placeholder="Minimum 6 characters"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Target Exam */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text)' }}
              >
                Target Exam
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }}>
                  <GraduationCap size={16} />
                </div>
                <select
                  name="targetExam"
                  value={form.targetExam}
                  onChange={handle}
                  className="input-field select"
                  style={{ paddingLeft: '2.5rem' }}
                >
                  {EXAMS.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2"
              style={{
                height: 48,
                background: 'linear-gradient(135deg, #7B5EF8, #4F8EF7)',
                boxShadow: '0 4px 15px rgba(123, 94, 248, 0.35)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Already have an account?
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
          </div>

          <Link
            to="/login"
            className="block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-white/5"
            style={{
              border: '1px solid var(--color-border)',
              color: 'var(--color-accent)',
            }}
          >
            Sign in instead
          </Link>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--color-muted)' }}>
          By signing up, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  )
}

export default SignupPage
