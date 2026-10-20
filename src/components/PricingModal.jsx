import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Zap, Check, X, AlertCircle, Loader2, CreditCard, ShieldCheck } from 'lucide-react'
import { getPaymentPlans, createPaymentOrder, verifyPayment } from '../api/payment'
import useAuthStore from '../store/authStore'

export default function PricingModal({ isOpen, onClose, onPaymentSuccess, reason = '' }) {
  const updateUser = useAuthStore((s) => s.updateUser)

  const [activeTab, setActiveTab] = useState('plans')
  const [plansData, setPlansData] = useState({ plans: [], topups: [] })
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setError('')
    setSuccessMsg('')
    setProcessingId(null)
    setVerifying(false)

    getPaymentPlans()
      .then((data) => setPlansData(data))
      .catch((err) => setError(err.response?.data?.error || err.message || 'Failed to load plans.'))
      .finally(() => setLoading(false))
  }, [isOpen])

  if (!isOpen) return null

  const handlePayWithCashfree = async (item) => {
    setProcessingId(item.id)
    setError('')
    setSuccessMsg('')

    try {
      // 1. Create order on backend via Cashfree Orders API
      const orderRes = await createPaymentOrder(item.id)
      if (!orderRes.success || !orderRes.paymentSessionId) {
        throw new Error(orderRes.error || 'Failed to create payment session with Cashfree.')
      }

      // 2. Initialize Cashfree JS SDK v3
      if (typeof window.Cashfree === 'undefined') {
        throw new Error('Cashfree SDK is loading. Please check your internet connection or refresh.')
      }

      const mode = orderRes.environment === 'production' ? 'production' : 'sandbox'
      const cashfree = window.Cashfree({ mode })

      // 3. Launch Cashfree Drop-in Checkout Modal
      const checkoutOptions = {
        paymentSessionId: orderRes.paymentSessionId,
        redirectTarget: '_modal',
      }

      const result = await cashfree.checkout(checkoutOptions)

      if (result?.redirect) {
        // Cashfree is handling redirection to payment provider / return_url
        return
      }

      if (result?.error) {
        setError(result.error.message || 'Payment cancelled or dismissed.')
        return
      }

      // 4. Verification with backend
      setVerifying(true)
      const verifyRes = await verifyPayment({ orderId: orderRes.orderId })

      if (verifyRes.success) {
        setSuccessMsg(`🎉 Success! Added ${verifyRes.creditsAdded} credits to your account!`)
        if (verifyRes.user && updateUser) {
          updateUser(verifyRes.user)
        }
        if (onPaymentSuccess) onPaymentSuccess(verifyRes.user)
        setTimeout(() => {
          onClose()
        }, 1800)
      } else {
        setError(verifyRes.message || 'Payment status pending verification. Please refresh shortly.')
      }
    } catch (err) {
      console.error('[CashfreeCheckout] Error:', err)
      setError(err.response?.data?.error || err.message || 'Payment initiation failed.')
    } finally {
      setProcessingId(null)
      setVerifying(false)
    }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(5,8,15,0.82)', backdropFilter: 'blur(8px)' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 960,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 'clamp(16px, 4vw, 32px)',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          animation: 'fadeIn 0.25s ease forwards',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 32,
            height: 32,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-3)',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, marginBottom: 8, background: 'var(--indigo-dim)', color: 'var(--indigo)', border: '1px solid var(--indigo-border)' }}>
            <ShieldCheck size={13} /> Secured by Cashfree Payments (UPI, Cards, Netbanking)
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 560, margin: '0 0 6px', color: 'var(--text-1)' }}>
            Choose Your Exam Preparation Pass
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 500, margin: '0 auto', lineHeight: 1.5 }}>
            Full APPSC &amp; TGPSC syllabus coverage, AI mock test generation, Bloom's L3-5 analytical questions, and instant explanations.
          </p>
          {reason && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '6px 12px', borderRadius: 8, background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', color: 'var(--gold-hi)', fontSize: 12 }}>
              <AlertCircle size={13} /> {reason}
            </div>
          )}
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', padding: 4, borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setActiveTab('plans')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: activeTab === 'plans' ? 600 : 500,
                border: 'none',
                background: activeTab === 'plans' ? 'var(--surface)' : 'transparent',
                color: activeTab === 'plans' ? 'var(--text-1)' : 'var(--text-3)',
                cursor: 'pointer',
              }}
            >
              Monthly Passes
            </button>
            <button
              onClick={() => setActiveTab('topups')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: activeTab === 'topups' ? 600 : 500,
                border: 'none',
                background: activeTab === 'topups' ? 'var(--surface)' : 'transparent',
                color: activeTab === 'topups' ? 'var(--text-1)' : 'var(--text-3)',
                cursor: 'pointer',
              }}
            >
              Instant Top-Ups
            </button>
          </div>
        </div>

        {error && (
          <div style={{ maxWidth: 540, margin: '0 auto 16px', padding: '10px 14px', borderRadius: 8, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {successMsg && (
          <div style={{ maxWidth: 540, margin: '0 auto 16px', padding: '10px 14px', borderRadius: 8, background: 'var(--emerald-dim)', border: '1px solid var(--emerald-border)', color: 'var(--emerald)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={14} /> {successMsg}
          </div>
        )}

        {loading || verifying ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 size={28} style={{ color: 'var(--indigo)', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
              {verifying ? 'Verifying payment with Cashfree...' : 'Loading plans...'}
            </p>
          </div>
        ) : activeTab === 'plans' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(plansData.plans || []).map((plan) => {
              const isPopular = (plan.badge || '').toUpperCase().includes('VALUE') || (plan.badge || '').toUpperCase().includes('POPULAR')
              const isProcessing = processingId === plan.id
              return (
                <div
                  key={plan.id}
                  style={{
                    background: 'var(--surface-elevated)',
                    border: isPopular ? '2px solid var(--gold)' : '1px solid var(--border)',
                    borderRadius: 14,
                    padding: 20,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {plan.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '2px 10px',
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: isPopular ? 'linear-gradient(155deg, var(--gold-hi), var(--gold))' : 'var(--indigo)',
                        color: isPopular ? '#0A0F1C' : '#ffffff',
                      }}
                    >
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 560, margin: '4px 0', color: 'var(--text-1)' }}>
                      {plan.name}
                    </h4>
                    <p style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.4, margin: '0 0 14px', minHeight: 32 }}>
                      {plan.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 14 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600, color: 'var(--text-1)' }}>
                        ₹{plan.price}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        / {plan.durationDays > 30 ? `${plan.durationDays / 30} mo` : 'mo'}
                      </span>
                    </div>

                    <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={13} style={{ color: 'var(--gold-hi)' }} />
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--gold-hi)', fontFamily: 'var(--font-mono)' }}>
                        {plan.credits} AI Credits
                      </span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-2)' }}>
                      <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Check size={13} style={{ color: 'var(--emerald)' }} /> All APPSC &amp; TGPSC Subjects
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Check size={13} style={{ color: 'var(--emerald)' }} /> Bloom's L3-5 Questions
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Check size={13} style={{ color: 'var(--emerald)' }} /> Detailed Explanations
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handlePayWithCashfree(plan)}
                    disabled={isProcessing || verifying}
                    className={isPopular ? 'btn-gold' : 'btn-primary'}
                    style={{ width: '100%', height: 38, fontSize: 12.5 }}
                  >
                    {isProcessing ? (
                      <Loader2 size={14} className="animate-spin-slow" />
                    ) : (
                      <>
                        <CreditCard size={14} /> Pay ₹{plan.price} via Cashfree
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(plansData.topups || []).map((topup) => {
              const isProcessing = processingId === topup.id
              return (
                <div
                  key={topup.id}
                  style={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 560, margin: '0 0 4px', color: 'var(--text-1)' }}>
                      {topup.name}
                    </h4>
                    <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '0 0 14px' }}>
                      {topup.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 14 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600, color: 'var(--text-1)' }}>
                        ₹{topup.price}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>one-time</span>
                    </div>

                    <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--emerald-dim)', border: '1px solid var(--emerald-border)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={13} style={{ color: 'var(--emerald)' }} />
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>
                        +{topup.credits} Credits
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePayWithCashfree(topup)}
                    disabled={isProcessing || verifying}
                    className="btn-primary"
                    style={{ width: '100%', height: 38, fontSize: 12.5 }}
                  >
                    {isProcessing ? (
                      <Loader2 size={14} className="animate-spin-slow" />
                    ) : (
                      <>
                        <CreditCard size={14} /> Pay ₹{topup.price} via Cashfree
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: 22, paddingTop: 14, borderTop: '1px solid var(--border-soft)', textAlign: 'center', fontSize: 11.5, color: 'var(--text-3)' }}>
          <div style={{ marginBottom: 4 }}>
            <strong style={{ color: 'var(--text-2)' }}>Notice:</strong> All AI credit purchases are final and strictly non-refundable once provisioned.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <Link to="/refund-policy" onClick={onClose} style={{ color: 'var(--indigo)', textDecoration: 'underline' }}>Refund Policy</Link>
            <span>•</span>
            <Link to="/terms-and-conditions" onClick={onClose} style={{ color: 'var(--indigo)', textDecoration: 'underline' }}>Terms of Service</Link>
            <span>•</span>
            <Link to="/privacy-policy" onClick={onClose} style={{ color: 'var(--indigo)', textDecoration: 'underline' }}>Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
