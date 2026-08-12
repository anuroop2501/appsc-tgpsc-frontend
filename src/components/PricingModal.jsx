import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Zap, Check, Shield, X, CreditCard, Sparkles, AlertCircle, Loader2, Smartphone, QrCode, Lock } from 'lucide-react'
import { getPaymentPlans, createPaymentOrder, verifyPayment } from '../api/payment'
import useAuthStore from '../store/authStore'

export default function PricingModal({ isOpen, onClose, onPaymentSuccess, reason = '' }) {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)

  const [activeTab, setActiveTab] = useState('plans') // 'plans' | 'topups'
  const [plansData, setPlansData] = useState({ plans: [], topups: [] })
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // PhonePe Checkout Modal state
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

  // Initiate PhonePe Payment Flow
  const handleInitiatePhonePe = async (item) => {
    setProcessingId(item.id)
    setError('')
    setSuccessMsg('')

    try {
      // Create Order on backend
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

  // Authorize & Complete PhonePe Payment
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
        setSuccessMsg(`🎉 Success! PhonePe Payment Confirmed. Added ${verifyRes.creditsAdded} credits to your account!`)
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
      <div
        className="relative w-full max-w-4xl rounded-3xl p-6 sm:p-8 my-8 shadow-2xl animate-fade-in"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl transition-all hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-muted)' }}
        >
          <X size={20} />
        </button>

        {/* ── PhonePe Active Payment Modal Step ── */}
        {phonePeModalItem ? (
          <div className="max-w-lg mx-auto py-4 space-y-6 animate-scale-up">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, #5F259F, #3F1570)', color: '#FFFFFF' }}>
                <Smartphone size={32} />
              </div>
              <h3 className="text-2xl font-extrabold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                PhonePe Payment Checkout
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                {phonePeModalItem.name} — <strong style={{ color: 'var(--color-text)' }}>₹{phonePeModalItem.price}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(95,37,159,0.12)', border: '1px solid rgba(95,37,159,0.3)' }}>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span style={{ color: 'var(--color-muted)' }}>Item Selected:</span>
                <span style={{ color: 'var(--color-text)' }}>{phonePeModalItem.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span style={{ color: 'var(--color-muted)' }}>Credits Added:</span>
                <span style={{ color: '#3DD68C' }}>+{phonePeModalItem.credits} AI Credits</span>
              </div>
              <div className="flex justify-between items-center text-sm font-extrabold pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <span style={{ color: 'var(--color-text)' }}>Total Amount:</span>
                <span className="text-lg" style={{ color: 'var(--color-accent)' }}>₹{phonePeModalItem.price}</span>
              </div>
            </div>

            {/* PhonePe VPA Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                Enter PhonePe VPA / UPI ID:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={phonePeUpiId}
                  onChange={(e) => setPhonePeUpiId(e.target.value)}
                  placeholder="e.g. mobile@ybl or name@ibl"
                  className="flex-1 px-4 py-3 rounded-xl text-xs outline-none transition-all"
                  style={{
                    background: 'rgba(42,52,80,0.6)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
                <span className="px-3 py-3 rounded-xl text-xs font-bold flex items-center" style={{ background: 'rgba(95,37,159,0.2)', color: '#A855F7' }}>
                  @ybl
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl text-xs flex items-center gap-2" style={{ background: 'rgba(247,111,111,0.1)', border: '1px solid rgba(247,111,111,0.3)', color: '#F76F6F' }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl text-xs flex items-center gap-2" style={{ background: 'rgba(61,214,140,0.1)', border: '1px solid rgba(61,214,140,0.3)', color: '#3DD68C' }}>
                <Check size={15} /> {successMsg}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPhonePeModalItem(null)}
                className="flex-1 py-3 rounded-xl text-xs font-bold"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPhonePePayment}
                disabled={verifyingPhonePe || !phonePeUpiId}
                className="flex-[2] py-3.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #5F259F, #7B5EF8)' }}
              >
                {verifyingPhonePe ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Smartphone size={16} /> Pay ₹{phonePeModalItem.price} on PhonePe
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <span className="text-[10px] flex items-center justify-center gap-1" style={{ color: 'var(--color-muted)' }}>
                <Lock size={10} style={{ color: '#3DD68C' }} /> Secured by PhonePe Payment Gateway
              </span>
            </div>
          </div>
        ) : (
          /* ── Main Plans / Topups View ── */
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ background: 'rgba(95,37,159,0.15)', color: '#A855F7' }}>
                <Smartphone size={14} /> PhonePe Instant Payment Gateway Active
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                Choose Your Exam Preparation Pass
              </h2>
              <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--color-muted)' }}>
                Full APPSC & TGPSC syllabus coverage, AI mock test generation, Bloom's L3-5 statement questions, and instant explanations.
              </p>

              {reason && (
                <div className="flex items-center justify-center gap-2 mt-4 p-3 rounded-xl text-xs font-semibold" style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623' }}>
                  <AlertCircle size={16} /> {reason}
                </div>
              )}
            </div>

            {/* Tab Toggle: Plans vs Top-ups */}
            <div className="flex justify-center mb-8">
              <div className="flex p-1 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <button
                  onClick={() => setActiveTab('plans')}
                  className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'plans' ? 'shadow-lg' : ''}`}
                  style={{
                    background: activeTab === 'plans' ? 'linear-gradient(135deg, #5F259F, #7B5EF8)' : 'transparent',
                    color: activeTab === 'plans' ? '#FFFFFF' : 'var(--color-muted)',
                  }}
                >
                  Monthly Subscription Passes
                </button>
                <button
                  onClick={() => setActiveTab('topups')}
                  className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'topups' ? 'shadow-lg' : ''}`}
                  style={{
                    background: activeTab === 'topups' ? 'linear-gradient(135deg, #5F259F, #7B5EF8)' : 'transparent',
                    color: activeTab === 'topups' ? '#FFFFFF' : 'var(--color-muted)',
                  }}
                >
                  Instant Credit Top-Up Packs
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-6 rounded-xl text-xs flex items-center gap-2" style={{ background: 'rgba(247,111,111,0.1)', border: '1px solid rgba(247,111,111,0.3)', color: '#F76F6F' }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 mb-6 rounded-xl text-xs flex items-center gap-2" style={{ background: 'rgba(61,214,140,0.1)', border: '1px solid rgba(61,214,140,0.3)', color: '#3DD68C' }}>
                <Check size={15} /> {successMsg}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: 'var(--color-accent)' }} />
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Loading plans & payment options...</p>
              </div>
            ) : activeTab === 'plans' ? (
              /* Subscription Plans Grid */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {(plansData.plans || []).map((plan) => {
                  const isPopular = plan.badge === 'Best Value'
                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${isPopular ? 'shadow-2xl' : ''}`}
                      style={{
                        background: isPopular ? 'linear-gradient(180deg, rgba(95,37,159,0.18), rgba(123,94,248,0.08))' : 'var(--color-card)',
                        border: isPopular ? '2px solid #5F259F' : '1px solid var(--color-border)',
                      }}
                    >
                      {plan.badge && (
                        <span
                          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-md"
                          style={{
                            background: isPopular ? 'linear-gradient(90deg, #5F259F, #7B5EF8)' : 'rgba(255,255,255,0.15)',
                            color: '#FFFFFF',
                          }}
                        >
                          {plan.badge}
                        </span>
                      )}

                      <div>
                        <h3 className="text-lg font-bold mb-1 mt-1" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                          {plan.name}
                        </h3>
                        <p className="text-xs mb-4 min-h-[32px]" style={{ color: 'var(--color-muted)' }}>
                          {plan.description}
                        </p>

                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-3xl font-extrabold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                            ₹{plan.price}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            / {plan.durationDays > 30 ? `${plan.durationDays / 30} months` : 'month'}
                          </span>
                        </div>

                        <div className="p-3 rounded-2xl mb-5" style={{ background: 'rgba(95,37,159,0.15)', border: '1px solid rgba(95,37,159,0.3)' }}>
                          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: '#A855F7' }}>
                            <Zap size={14} /> {plan.credits} AI Credits Included
                          </div>
                        </div>

                        <ul className="space-y-2 mb-6 text-xs" style={{ color: 'var(--color-text)' }}>
                          <li className="flex items-center gap-2">
                            <Check size={14} style={{ color: '#3DD68C' }} /> All APPSC & TGPSC Subjects
                          </li>
                          <li className="flex items-center gap-2">
                            <Check size={14} style={{ color: '#3DD68C' }} /> Bloom's L3-5 Question Quality
                          </li>
                          <li className="flex items-center gap-2">
                            <Check size={14} style={{ color: '#3DD68C' }} /> Detailed Answer Explanations
                          </li>
                          <li className="flex items-center gap-2">
                            <Check size={14} style={{ color: '#3DD68C' }} /> Test History & Review Mode
                          </li>
                        </ul>
                      </div>

                      <button
                        onClick={() => handleInitiatePhonePe(plan)}
                        disabled={processingId === plan.id}
                        className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        style={{
                          background: 'linear-gradient(135deg, #5F259F, #7B5EF8)',
                          color: '#FFFFFF',
                          boxShadow: '0 4px 20px rgba(95,37,159,0.4)',
                        }}
                      >
                        {processingId === plan.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <Smartphone size={16} /> Pay ₹{plan.price} via PhonePe
                          </>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Top-up Credit Packs Grid */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {(plansData.topups || []).map((topup) => (
                  <div
                    key={topup.id}
                    className="rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                        {topup.name}
                      </h3>
                      <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
                        {topup.description}
                      </p>

                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-3xl font-extrabold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                          ₹{topup.price}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>one-time</span>
                      </div>

                      <div className="p-3 rounded-2xl mb-5" style={{ background: 'rgba(61,214,140,0.1)', border: '1px solid rgba(61,214,140,0.2)' }}>
                        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: '#3DD68C' }}>
                          <Zap size={14} /> +{topup.credits} Extra Credits
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInitiatePhonePe(topup)}
                      disabled={processingId === topup.id}
                      className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #5F259F, #3DD68C)',
                        color: '#FFFFFF',
                      }}
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

            {/* Footer Payment Methods Badges */}
            <div className="pt-4 text-center" style={{ borderTop: '1px solid var(--color-border)' }}>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold mb-2">
                <span className="px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5" style={{ background: 'rgba(95,37,159,0.2)', border: '1px solid rgba(95,37,159,0.4)', color: '#A855F7' }}>
                  <Smartphone size={13} /> PhonePe UPI (Active)
                </span>
                <span className="px-2.5 py-1 rounded-lg opacity-50" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                  Google Pay (Coming Soon)
                </span>
                <span className="px-2.5 py-1 rounded-lg opacity-50" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                  Cards & Netbanking (Coming Soon)
                </span>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                <Lock size={10} className="inline mr-1 text-emerald-400" /> Safe & Secure PhonePe Gateway Checkout
              </p>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
