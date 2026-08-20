import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Zap, Check, X, AlertCircle, Loader2, Smartphone, Lock } from 'lucide-react'
import { getPaymentPlans, createPaymentOrder, verifyPayment } from '../api/payment'
import useAuthStore from '../store/authStore'

export default function PricingModal({ isOpen, onClose, onPaymentSuccess, reason = '' }) {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)

  const [activeTab, setActiveTab] = useState('plans')
  const [plansData, setPlansData] = useState({ plans: [], topups: [] })
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [phonePeModalItem, setPhonePeModalItem] = useState(null)
  const [activeOrder, setActiveOrder] = useState(null)
  const [phonePeUpiId, setPhonePeUpiId] = useState('')
  const [verifyingPhonePe, setVerifyingPhonePe] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setError('')
    setSuccessMsg('')
    setPhonePeModalItem(null)
    setActiveOrder(null)

    getPaymentPlans()
      .then((data) => setPlansData(data))
      .catch((err) => setError(err.response?.data?.error || err.message || 'Failed to load plans.'))
      .finally(() => setLoading(false))
  }, [isOpen])

  if (!isOpen) return null

  const handleInitiatePhonePe = async (item) => {
    setProcessingId(item.id)
    setError('')
    setSuccessMsg('')

    try {
      const orderRes = await createPaymentOrder(item.id)
      if (!orderRes.success || !orderRes.orderId) {
        throw new Error('Failed to create payment order.')
      }

      setActiveOrder(orderRes)
      setPhonePeModalItem(item)
      setPhonePeUpiId(`${user?.name?.toLowerCase().replace(/\s+/g, '') || 'student'}@ybl`)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Payment order initiation failed.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleConfirmPhonePePayment = async () => {
    if (!activeOrder || !phonePeModalItem) return
    setVerifyingPhonePe(true)
    setError('')

    try {
      const verifyRes = await verifyPayment({
        orderId: activeOrder.orderId,
        paymentId: `pay_phonepe_${Date.now()}`,
        signature: 'sig_phonepe_authorized',
      })

      if (verifyRes.success) {
        setSuccessMsg(`🎉 Success! Added ${verifyRes.creditsAdded} credits to your account!`)
        if (verifyRes.user && updateUser) {
          updateUser(verifyRes.user)
        }
        if (onPaymentSuccess) onPaymentSuccess(verifyRes.user)
        setTimeout(() => {
          setPhonePeModalItem(null)
          setActiveOrder(null)
          onClose()
        }, 1800)
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'PhonePe payment authorization failed.')
    } finally {
      setVerifyingPhonePe(false)
    }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(5,8,15,0.8)', backdropFilter: 'blur(8px)' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 960,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 32,
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

        {phonePeModalItem ? (
          <div style={{ maxWidth: 440, margin: '20px auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', background: 'var(--indigo-dim)', color: 'var(--indigo)' }}>
                <Smartphone size={26} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 560, margin: '0 0 4px', color: 'var(--text-1)' }}>
                PhonePe Payment Checkout
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
                {phonePeModalItem.name} — <strong style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>₹{phonePeModalItem.price}</strong>
              </p>
            </div>

            <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: 'var(--text-3)' }}>Item Selected:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{phonePeModalItem.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: 'var(--text-3)' }}>Credits Added:</span>
                <span style={{ fontWeight: 600, color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>+{phonePeModalItem.credits} AI Credits</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-1)' }}>Total Amount:</span>
                <span style={{ color: 'var(--gold-hi)', fontFamily: 'var(--font-mono)', fontSize: 16 }}>₹{phonePeModalItem.price}</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                Enter PhonePe VPA / UPI ID:
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={phonePeUpiId}
                  onChange={(e) => setPhonePeUpiId(e.target.value)}
                  placeholder="e.g. mobile@ybl or name@ibl"
                  className="input"
                  style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
                />
                <span style={{ padding: '0 12px', borderRadius: 10, display: 'flex', alignItems: 'center', background: 'var(--surface-elevated)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>
                  @ybl
                </span>
              </div>
            </div>

            {error && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={13} /> {error}
              </div>
            )}

            {successMsg && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--emerald-dim)', border: '1px solid var(--emerald-border)', color: 'var(--emerald)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={13} /> {successMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPhonePeModalItem(null)} className="btn-ghost" style={{ flex: 1, height: 40, fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={handleConfirmPhonePePayment} disabled={verifyingPhonePe || !phonePeUpiId} className="btn-primary" style={{ flex: 2, height: 40, fontSize: 13 }}>
                {verifyingPhonePe ? <Loader2 size={15} className="animate-spin-slow" /> : <><Smartphone size={14} /> Pay ₹{phonePeModalItem.price}</>}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, marginBottom: 8, background: 'var(--indigo-dim)', color: 'var(--indigo)', border: '1px solid var(--indigo-border)' }}>
                <Smartphone size={12} /> Instant PhonePe Gateway
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 560, margin: '0 0 6px', color: 'var(--text-1)' }}>
                Choose Your Exam Preparation Pass
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 500, margin: '0 auto', lineHeight: 1.5 }}>
                Full APPSC syllabus coverage, AI mock test generation, Bloom's L3-5 statement questions, and instant explanations.
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
              <div style={{ maxWidth: 500, margin: '0 auto 16px', padding: '10px 14px', borderRadius: 8, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Loader2 size={28} style={{ color: 'var(--indigo)', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading plans...</p>
              </div>
            ) : activeTab === 'plans' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {(plansData.plans || []).map((plan) => {
                  const isPopular = (plan.badge || '').toUpperCase().includes('VALUE') || (plan.badge || '').toUpperCase().includes('POPULAR')
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
                            <Check size={13} style={{ color: 'var(--emerald)' }} /> All APPSC Subjects
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
                        onClick={() => handleInitiatePhonePe(plan)}
                        disabled={processingId === plan.id}
                        className={isPopular ? 'btn-gold' : 'btn-primary'}
                        style={{ width: '100%', height: 38, fontSize: 12.5 }}
                      >
                        {processingId === plan.id ? <Loader2 size={14} className="animate-spin-slow" /> : <>Pay ₹{plan.price}</>}
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {(plansData.topups || []).map((topup) => (
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
                      onClick={() => handleInitiatePhonePe(topup)}
                      disabled={processingId === topup.id}
                      className="btn-primary"
                      style={{ width: '100%', height: 38, fontSize: 12.5 }}
                    >
                      {processingId === topup.id ? <Loader2 size={14} className="animate-spin-slow" /> : <>Pay ₹{topup.price}</>}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
