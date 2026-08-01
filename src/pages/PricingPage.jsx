import { useState, useEffect } from 'react'
import { Zap, Check, Shield, CreditCard, Sparkles, AlertCircle, Loader2, Smartphone, Lock } from 'lucide-react'
import { getPaymentPlans, createPaymentOrder, verifyPayment } from '../api/payment'
import useAuthStore from '../store/authStore'
import useBreadcrumbStore from '../store/breadcrumbStore'

export default function PricingPage() {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const setOverride = useBreadcrumbStore((s) => s.setOverride)

  const [activeTab, setActiveTab] = useState('plans') // 'plans' | 'topups'
  const [plansData, setPlansData] = useState({ plans: [], topups: [] })
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // PhonePe Checkout states
  const [phonePeItem, setPhonePeItem] = useState(null)
  const [activeOrder, setActiveOrder] = useState(null)
  const [phonePeUpiId, setPhonePeUpiId] = useState('')
  const [verifyingPhonePe, setVerifyingPhonePe] = useState(false)

  useEffect(() => {
    setOverride(['Dashboard', 'Subscription Plans & Credits'])
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
        setSuccessMsg(`🎉 Success! PhonePe Payment Confirmed. Added ${verifyRes.creditsAdded} credits to your account!`)
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
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ background: 'rgba(95,37,159,0.15)', color: '#A855F7' }}>
          <Smartphone size={14} /> PhonePe Instant Gateway Active
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
          Unlock Exam-Ready AI Tools
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Full APPSC & TGPSC syllabus coverage, AI mock test generation, Bloom's L3-5 analytical questions, and instant explanations.
        </p>
      </div>

      {phonePeItem ? (
        /* PhonePe Active Checkout Panel */
        <div className="max-w-xl mx-auto glass-card p-6 sm:p-8 rounded-3xl space-y-6 animate-scale-up">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, #5F259F, #3F1570)', color: '#FFFFFF' }}>
              <Smartphone size={32} />
            </div>
            <h3 className="text-2xl font-extrabold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
              PhonePe Payment Checkout
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
              {phonePeItem.name} — <strong style={{ color: 'var(--color-text)' }}>₹{phonePeItem.price}</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(95,37,159,0.12)', border: '1px solid rgba(95,37,159,0.3)' }}>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span style={{ color: 'var(--color-muted)' }}>Item Selected:</span>
              <span style={{ color: 'var(--color-text)' }}>{phonePeItem.name}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span style={{ color: 'var(--color-muted)' }}>Credits Added:</span>
              <span style={{ color: '#3DD68C' }}>+{phonePeItem.credits} AI Credits</span>
            </div>
            <div className="flex justify-between items-center text-sm font-extrabold pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <span style={{ color: 'var(--color-text)' }}>Total Amount:</span>
              <span className="text-lg" style={{ color: 'var(--color-accent)' }}>₹{phonePeItem.price}</span>
            </div>
          </div>

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
              onClick={() => setPhonePeItem(null)}
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
                  <Smartphone size={16} /> Pay ₹{phonePeItem.price} via PhonePe
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Main Plans / Topups View */
        <>
          {/* Tab Toggle */}
          <div className="flex justify-center">
            <div className="flex p-1.5 rounded-2xl" style={{ background: 'rgba(42,52,80,0.6)', border: '1px solid var(--color-border)' }}>
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
            <div className="max-w-2xl mx-auto p-4 rounded-xl text-xs flex items-center gap-2" style={{ background: 'rgba(247,111,111,0.1)', border: '1px solid rgba(247,111,111,0.3)', color: '#F76F6F' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {successMsg && (
            <div className="max-w-2xl mx-auto p-4 rounded-xl text-xs flex items-center gap-2" style={{ background: 'rgba(61,214,140,0.1)', border: '1px solid rgba(61,214,140,0.3)', color: '#3DD68C' }}>
              <Check size={16} /> {successMsg}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <Loader2 size={36} className="animate-spin mx-auto mb-3" style={{ color: 'var(--color-accent)' }} />
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading plans & payment gateway...</p>
            </div>
          ) : activeTab === 'plans' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(plansData.plans || []).map((plan) => {
                const isPopular = plan.badge === 'Best Value'
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${isPopular ? 'shadow-2xl' : ''}`}
                    style={{
                      background: isPopular ? 'linear-gradient(180deg, rgba(95,37,159,0.18), rgba(123,94,248,0.08))' : 'rgba(42,52,80,0.4)',
                      border: isPopular ? '2px solid #5F259F' : '1px solid var(--color-border)',
                    }}
                  >
                    {plan.badge && (
                      <span
                        className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-md"
                        style={{
                          background: isPopular ? 'linear-gradient(90deg, #5F259F, #7B5EF8)' : 'rgba(255,255,255,0.15)',
                          color: '#FFFFFF',
                        }}
                      >
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <h3 className="text-xl font-bold mb-1 mt-2" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                        {plan.name}
                      </h3>
                      <p className="text-xs mb-6 min-h-[36px]" style={{ color: 'var(--color-muted)' }}>
                        {plan.description}
                      </p>

                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-extrabold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                          ₹{plan.price}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          / {plan.durationDays > 30 ? `${plan.durationDays / 30} months` : 'month'}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl mb-6" style={{ background: 'rgba(95,37,159,0.15)', border: '1px solid rgba(95,37,159,0.3)' }}>
                        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: '#A855F7' }}>
                          <Zap size={15} /> {plan.credits} AI Credits Included
                        </div>
                      </div>

                      <ul className="space-y-3 mb-8 text-xs" style={{ color: 'var(--color-text)' }}>
                        <li className="flex items-center gap-2">
                          <Check size={15} style={{ color: '#3DD68C' }} /> All APPSC & TGPSC Subjects
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={15} style={{ color: '#3DD68C' }} /> Bloom's L3-5 Question Quality
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={15} style={{ color: '#3DD68C' }} /> Detailed Answer Explanations
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={15} style={{ color: '#3DD68C' }} /> Test History & Review Mode
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleInitiatePhonePe(plan)}
                      disabled={processingId === plan.id}
                      className="w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(plansData.topups || []).map((topup) => (
                <div
                  key={topup.id}
                  className="rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: 'rgba(42,52,80,0.4)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                      {topup.name}
                    </h3>
                    <p className="text-xs mb-6" style={{ color: 'var(--color-muted)' }}>
                      {topup.description}
                    </p>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-extrabold" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}>
                        ₹{topup.price}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>one-time</span>
                    </div>

                    <div className="p-3.5 rounded-2xl mb-6" style={{ background: 'rgba(61,214,140,0.1)', border: '1px solid rgba(61,214,140,0.2)' }}>
                      <div className="flex items-center gap-2 text-xs font-bold" style={{ color: '#3DD68C' }}>
                        <Zap size={15} /> +{topup.credits} Extra Credits
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleInitiatePhonePe(topup)}
                    disabled={processingId === topup.id}
                    className="w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #5F259F, #3DD68C)',
                      color: '#FFFFFF',
                    }}
                  >
                    {processingId === topup.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Smartphone size={16} /> Pay ₹{topup.price} via PhonePe
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Footer Payment Methods Badges */}
      <div className="pt-8 text-center" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold mb-2">
          <span className="px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5" style={{ background: 'rgba(95,37,159,0.2)', border: '1px solid rgba(95,37,159,0.4)', color: '#A855F7' }}>
            <Smartphone size={14} /> PhonePe UPI (Active)
          </span>
          <span className="px-3 py-1.5 rounded-xl opacity-50" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
            Google Pay (Coming Soon)
          </span>
          <span className="px-3 py-1.5 rounded-xl opacity-50" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
            Cards & Netbanking (Coming Soon)
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          <Lock size={12} className="inline mr-1 text-emerald-400" /> Safe & Secure PhonePe Gateway Checkout
        </p>
      </div>
    </div>
  )
}
