import { useState, useEffect } from 'react'
import { Zap, Check, Smartphone, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { getPaymentPlans, createPaymentOrder, verifyPayment } from '../api/payment'
import useAuthStore from '../store/authStore'
import useBreadcrumbStore from '../store/breadcrumbStore'

export default function PricingPage() {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const setOverride = useBreadcrumbStore((s) => s.setOverride)

  const [activeTab, setActiveTab] = useState('plans')
  const [plansData, setPlansData] = useState({ plans: [], topups: [] })
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [phonePeItem, setPhonePeItem] = useState(null)
  const [activeOrder, setActiveOrder] = useState(null)
  const [phonePeUpiId, setPhonePeUpiId] = useState('')
  const [verifyingPhonePe, setVerifyingPhonePe] = useState(false)

  useEffect(() => {
    setOverride(['Dashboard', 'Plans & Pricing'])
    setLoading(true)
    setError('')
    getPaymentPlans()
      .then((data) => setPlansData(data))
      .catch((err) => setError(err.response?.data?.error || err.message || 'Failed to load plans.'))
      .finally(() => setLoading(false))
  }, [setOverride])

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
      setPhonePeItem(item)
      setPhonePeUpiId(`${user?.name?.toLowerCase().replace(/\s+/g, '') || 'student'}@ybl`)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Payment initiation failed.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleConfirmPhonePePayment = async () => {
    if (!activeOrder || !phonePeItem) return
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
        setTimeout(() => {
          setPhonePeItem(null)
          setActiveOrder(null)
        }, 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'PhonePe payment authorization failed.')
    } finally {
      setVerifyingPhonePe(false)
    }
  }

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', animation: 'fadeIn 0.4s ease forwards', paddingBottom: 40 }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 36px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, marginBottom: 14, background: 'var(--indigo-dim)', color: 'var(--indigo)', border: '1px solid var(--indigo-border)' }}>
          <Smartphone size={13} /> PhonePe Instant Gateway Active
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 560, fontSize: 36, margin: '0 0 10px', color: 'var(--text-1)' }}>
          Unlock Exam-Ready AI Tools
        </h1>
        <p style={{ fontSize: 14.5, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
          Full APPSC syllabus coverage, AI mock test generation, Bloom's L3-5 analytical questions, and instant explanations.
        </p>
      </div>

      {phonePeItem ? (
        /* PhonePe Active Checkout Panel */
        <div className="card" style={{ maxWidth: 500, margin: '0 auto', padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', background: 'var(--indigo-dim)', color: 'var(--indigo)' }}>
              <Smartphone size={28} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 560, margin: '0 0 4px', color: 'var(--text-1)' }}>
              PhonePe Payment Checkout
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
              {phonePeItem.name} — <strong style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>₹{phonePeItem.price}</strong>
            </p>
          </div>

          <div style={{ padding: 16, borderRadius: 12, background: 'var(--surface-elevated)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-3)' }}>Item Selected:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{phonePeItem.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-3)' }}>Credits Added:</span>
              <span style={{ fontWeight: 600, color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>+{phonePeItem.credits} AI Credits</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-1)' }}>Total Amount:</span>
              <span style={{ color: 'var(--gold-hi)', fontFamily: 'var(--font-mono)', fontSize: 18 }}>₹{phonePeItem.price}</span>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
              Enter PhonePe VPA / UPI ID:
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={phonePeUpiId}
                onChange={(e) => setPhonePeUpiId(e.target.value)}
                placeholder="e.g. mobile@ybl or name@ibl"
                className="input"
                style={{ flex: 1 }}
              />
              <span style={{ padding: '0 14px', borderRadius: 10, display: 'flex', alignItems: 'center', background: 'var(--surface-elevated)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>
                @ybl
              </span>
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 12px', borderRadius: 10, marginBottom: 16, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '10px 12px', borderRadius: 10, marginBottom: 16, background: 'var(--emerald-dim)', border: '1px solid var(--emerald-border)', color: 'var(--emerald)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} /> {successMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setPhonePeItem(null)}
              className="btn-ghost"
              style={{ flex: 1, height: 44 }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmPhonePePayment}
              disabled={verifyingPhonePe || !phonePeUpiId}
              className="btn-primary"
              style={{ flex: 2, height: 44 }}
            >
              {verifyingPhonePe ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Smartphone size={15} /> Pay ₹{phonePeItem.price} via PhonePe
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Tab Toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
            <div style={{ display: 'flex', padding: 5, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setActiveTab('plans')}
                style={{
                  padding: '9px 22px',
                  borderRadius: 9,
                  fontSize: 13.5,
                  fontWeight: activeTab === 'plans' ? 600 : 500,
                  border: 'none',
                  background: activeTab === 'plans' ? 'var(--surface-elevated)' : 'transparent',
                  color: activeTab === 'plans' ? 'var(--text-1)' : 'var(--text-3)',
                  boxShadow: activeTab === 'plans' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Monthly Subscription Passes
              </button>
              <button
                onClick={() => setActiveTab('topups')}
                style={{
                  padding: '9px 22px',
                  borderRadius: 9,
                  fontSize: 13.5,
                  fontWeight: activeTab === 'topups' ? 600 : 500,
                  border: 'none',
                  background: activeTab === 'topups' ? 'var(--surface-elevated)' : 'transparent',
                  color: activeTab === 'topups' ? 'var(--text-1)' : 'var(--text-3)',
                  boxShadow: activeTab === 'topups' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Instant Credit Top-Up Packs
              </button>
            </div>
          </div>

          {error && (
            <div style={{ maxWidth: 600, margin: '0 auto 20px', padding: '12px 16px', borderRadius: 10, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {successMsg && (
            <div style={{ maxWidth: 600, margin: '0 auto 20px', padding: '12px 16px', borderRadius: 10, background: 'var(--emerald-dim)', border: '1px solid var(--emerald-border)', color: 'var(--emerald)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={15} /> {successMsg}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Loader2 size={32} style={{ color: 'var(--indigo)', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Loading plans &amp; payment gateway...</p>
            </div>
          ) : activeTab === 'plans' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {(plansData.plans || []).map((plan) => {
                const isPopular = (plan.badge || '').toUpperCase().includes('VALUE') || (plan.badge || '').toUpperCase().includes('POPULAR')
                return (
                  <div
                    key={plan.id}
                    className="card"
                    style={{
                      padding: '32px 28px',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: isPopular ? '2px solid var(--gold)' : '1px solid var(--border)',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {plan.badge && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          padding: '3px 14px',
                          borderRadius: 20,
                          fontSize: 10.5,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          background: isPopular ? 'linear-gradient(155deg, var(--gold-hi), var(--gold))' : 'var(--indigo)',
                          color: isPopular ? '#0A0F1C' : '#ffffff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      >
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 560, margin: '4px 0 6px', color: 'var(--text-1)' }}>
                        {plan.name}
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5, margin: '0 0 22px', minHeight: 38 }}>
                        {plan.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 22 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 600, color: 'var(--text-1)' }}>
                          ₹{plan.price}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
                          / {plan.durationDays > 30 ? `${plan.durationDays / 30} months` : 'month'}
                        </span>
                      </div>

                      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Zap size={16} style={{ color: 'var(--gold-hi)' }} />
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--gold-hi)', fontFamily: 'var(--font-mono)' }}>
                          {plan.credits} AI Credits Included
                        </span>
                      </div>

                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5, color: 'var(--text-2)' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Check size={16} style={{ color: 'var(--emerald)', flexShrink: 0 }} /> All APPSC Subjects
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Check size={16} style={{ color: 'var(--emerald)', flexShrink: 0 }} /> Bloom's L3-5 Question Quality
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Check size={16} style={{ color: 'var(--emerald)', flexShrink: 0 }} /> Detailed Answer Explanations
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Check size={16} style={{ color: 'var(--emerald)', flexShrink: 0 }} /> Test History &amp; Review Mode
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleInitiatePhonePe(plan)}
                      disabled={processingId === plan.id}
                      className={isPopular ? 'btn-gold' : 'btn-primary'}
                      style={{ width: '100%', height: 46, fontSize: 14 }}
                    >
                      {processingId === plan.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Smartphone size={15} /> Pay ₹{plan.price} via PhonePe
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {(plansData.topups || []).map((topup) => (
                <div
                  key={topup.id}
                  className="card"
                  style={{
                    padding: '32px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 560, margin: '0 0 6px', color: 'var(--text-1)' }}>
                      {topup.name}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 22px', minHeight: 38 }}>
                      {topup.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 22 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 600, color: 'var(--text-1)' }}>
                        ₹{topup.price}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-3)' }}>one-time</span>
                    </div>

                    <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--emerald-dim)', border: '1px solid var(--emerald-border)', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Zap size={16} style={{ color: 'var(--emerald)' }} />
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>
                        +{topup.credits} Extra Credits
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleInitiatePhonePe(topup)}
                    disabled={processingId === topup.id}
                    className="btn-primary"
                    style={{ width: '100%', height: 46, fontSize: 14 }}
                  >
                    {processingId === topup.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Smartphone size={15} /> Pay ₹{topup.price} via PhonePe
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Footer Security Badges */}
      <div style={{ paddingTop: 32, marginTop: 44, borderTop: '1px solid var(--border-soft)', textAlign: 'center' }}>
        <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: 0 }}>
          <Lock size={13} style={{ display: 'inline', marginRight: 5, color: 'var(--emerald)' }} /> Safe &amp; Secure PhonePe Gateway Checkout · 256-bit SSL Encrypted
        </p>
      </div>
    </div>
  )
}
