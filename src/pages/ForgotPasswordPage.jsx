import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowLeft, KeyRound } from 'lucide-react'
import { forgotPassword, resetPassword } from '../api/auth'
import BrandLogo from '../components/BrandLogo'

const ForgotPasswordPage = () => {
  const navigate = useNavigate()

  // Steps: 'email' -> 'reset' -> 'success'
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleRequestToken = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your registered email address.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await forgotPassword({ email: email.trim().toLowerCase() })
      setResetToken(data.resetToken)
      setStep('reset')
      setSuccessMsg('Account verified. Please enter your new password below.')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to verify account. Please check your email.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-check.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await resetPassword({
        email: email.trim().toLowerCase(),
        newPassword,
        resetToken,
      })
      setStep('success')
      setSuccessMsg(data.message || 'Your password has been successfully reset!')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to reset password. Please try again.')
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
      {/* Ambient background glows */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,130,232,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,164,48,0.06) 0%, transparent 70%)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', animation: 'fadeIn 0.3s ease forwards' }}>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 'clamp(24px, 6vw, 40px) clamp(18px, 5vw, 36px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
            <div style={{ marginBottom: 12 }}>
              <BrandLogo size={48} showText={false} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: 22, margin: 0 }}>
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
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 560, fontSize: 22, margin: '0 0 4px', color: 'var(--text-1)' }}>
              {step === 'success' ? 'Password Reset Complete' : 'Reset your password'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              {step === 'email' && 'Enter your registered email address to verify your account.'}
              {step === 'reset' && 'Create a strong new password with at least 8 characters.'}
              {step === 'success' && 'You can now sign in with your new credentials.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                marginBottom: 16,
                background: 'var(--red-dim)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: 'var(--red)',
                fontSize: 13,
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                marginBottom: 16,
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--emerald, #10B981)',
                fontSize: 13,
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Step 1: Request Token via Email */}
          {step === 'email' && (
            <form onSubmit={handleRequestToken}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', zIndex: 1 }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    className="input"
                    style={{ paddingLeft: 36, height: 44, width: '100%' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', height: 46, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Verifying account…' : 'Continue'}
              </button>
            </form>
          )}

          {/* Step 2: Set New Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', zIndex: 1 }} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError('') }}
                      placeholder="At least 8 characters"
                      required
                      autoFocus
                      className="input"
                      style={{ paddingLeft: 36, paddingRight: 38, height: 44, width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 0 }}
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', zIndex: 1 }} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                      placeholder="Re-enter new password"
                      required
                      className="input"
                      style={{ paddingLeft: 36, height: 44, width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', height: 46, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Resetting password…' : 'Update Password'}
              </button>
            </form>
          )}

          {/* Step 3: Success Action */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn-primary"
                style={{ width: '100%', height: 46, fontSize: 14.5, fontWeight: 600 }}
              >
                Sign In Now
              </button>
            </div>
          )}

          {/* Back to Login link */}
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--text-3)',
                fontSize: 13,
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--indigo)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
