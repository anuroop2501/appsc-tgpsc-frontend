import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Zap,
  Check,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Receipt,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react'
import { getPaymentPlans, createPaymentOrder, verifyPayment, getPaymentHistory } from '../api/payment'
import useAuthStore from '../store/authStore'
import useBreadcrumbStore from '../store/breadcrumbStore'

export default function PricingPage() {
  const updateUser = useAuthStore((s) => s.updateUser)
  const setOverride = useBreadcrumbStore((s) => s.setOverride)
  const location = useLocation()

  const [activeTab, setActiveTab] = useState('plans') // 'plans' | 'topups' | 'history'
  const [plansData, setPlansData] = useState({ plans: [], topups: [] })
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Transaction History State
  const [transactions, setTransactions] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Fetch plans
  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getPaymentPlans()
      setPlansData(data)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load plans.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch transaction history
  const loadHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true)
    try {
      const data = await getPaymentHistory({ page, limit: 10 })
      setTransactions(data.transactions || [])
      setHistoryTotalPages(data.totalPages || 1)
      setHistoryPage(data.currentPage || page)
    } catch (err) {
      console.error('[PaymentHistory] Error:', err.message)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  // Handle return redirect from Cashfree (e.g. /pricing?order_id=CF_...)
  useEffect(() => {
    setOverride(['Dashboard', 'Plans & Pricing'])
    loadPlans()

    const searchParams = new URLSearchParams(location.search)
    const returnOrderId = searchParams.get('order_id') || searchParams.get('cf_order_id')

    if (returnOrderId) {
      setVerifying(true)
      setError('')
      verifyPayment({ orderId: returnOrderId })
        .then((res) => {
          if (res.success) {
            setSuccessMsg(`🎉 Payment Successful! Added ${res.creditsAdded} AI credits to your account.`)
            if (res.user && updateUser) {
              updateUser(res.user)
            }
            loadHistory(1)
          } else {
            setError(res.message || 'Payment status pending verification. Please refresh shortly.')
          }
        })
        .catch((err) => {
          setError(err.response?.data?.error || err.message || 'Payment verification failed.')
        })
        .finally(() => {
          setVerifying(false)
          // Clean up URL query parameters
          window.history.replaceState({}, document.title, window.location.pathname)
        })
    }
  }, [location.search, setOverride, updateUser, loadPlans, loadHistory])

  // Handle Tab Switch
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setError('')
    setSuccessMsg('')
    if (tab === 'history') {
      loadHistory(1)
    }
  }

  // Handle Cashfree Checkout
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
        throw new Error('Cashfree SDK is not available. Please refresh the page.')
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
        setError(result.error.message || 'Payment dismissed or cancelled.')
        return
      }

      // 4. Verification with backend
      setVerifying(true)
      const verifyRes = await verifyPayment({ orderId: orderRes.orderId })

      if (verifyRes.success) {
        setSuccessMsg(`🎉 Payment Complete! Added ${verifyRes.creditsAdded} credits to your account.`)
        if (verifyRes.user && updateUser) {
          updateUser(verifyRes.user)
        }
        loadHistory(1)
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', animation: 'fadeIn 0.4s ease forwards', paddingBottom: 40 }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 36px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, marginBottom: 14, background: 'var(--indigo-dim)', color: 'var(--indigo)', border: '1px solid var(--indigo-border)' }}>
          <ShieldCheck size={14} /> Official Cashfree Payment Gateway · 256-bit Encrypted
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 560, fontSize: 36, margin: '0 0 10px', color: 'var(--text-1)' }}>
          Unlock Exam-Ready AI Tools
        </h1>
        <p style={{ fontSize: 14.5, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
          Full APPSC &amp; TGPSC syllabus coverage, AI mock test generation, Bloom's L3-5 analytical questions, and instant explanations.
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
        <div style={{ display: 'flex', padding: 5, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', flexWrap: 'wrap', gap: 4 }}>
          <button
            onClick={() => handleTabChange('plans')}
            style={{
              padding: '9px 20px',
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
            Monthly Passes
          </button>
          <button
            onClick={() => handleTabChange('topups')}
            style={{
              padding: '9px 20px',
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
            Instant Credit Top-Ups
          </button>
          <button
            onClick={() => handleTabChange('history')}
            style={{
              padding: '9px 20px',
              borderRadius: 9,
              fontSize: 13.5,
              fontWeight: activeTab === 'history' ? 600 : 500,
              border: 'none',
              background: activeTab === 'history' ? 'var(--surface-elevated)' : 'transparent',
              color: activeTab === 'history' ? 'var(--text-1)' : 'var(--text-3)',
              boxShadow: activeTab === 'history' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Receipt size={14} /> Transaction History
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ maxWidth: 640, margin: '0 auto 20px', padding: '12px 16px', borderRadius: 10, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {successMsg && (
        <div style={{ maxWidth: 640, margin: '0 auto 20px', padding: '12px 16px', borderRadius: 10, background: 'var(--emerald-dim)', border: '1px solid var(--emerald-border)', color: 'var(--emerald)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={15} /> {successMsg}
        </div>
      )}

      {verifying && (
        <div style={{ maxWidth: 640, margin: '0 auto 20px', padding: '14px 18px', borderRadius: 10, background: 'var(--indigo-dim)', border: '1px solid var(--indigo-border)', color: 'var(--indigo)', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Loader2 size={18} className="animate-spin" />
          <span>Verifying your payment with Cashfree and provisioning AI credits...</span>
        </div>
      )}

      {/* TAB CONTENT */}
      {activeTab === 'history' ? (
        /* TRANSACTION HISTORY TAB */
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 650, margin: '0 0 4px', color: 'var(--text-1)' }}>
                Billing &amp; Payment History
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
                Records of all your pass subscriptions and credit top-up transactions.
              </p>
            </div>
            <button onClick={() => loadHistory(historyPage)} className="btn-ghost" style={{ fontSize: 12.5, padding: '6px 12px' }}>
              Refresh Records
            </button>
          </div>

          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Loader2 size={28} style={{ color: 'var(--indigo)', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <Receipt size={36} style={{ color: 'var(--text-3)', margin: '0 auto 12px' }} />
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 4px' }}>
                No payment transactions found
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
                When you purchase a subscription pass or booster pack, your receipts and order IDs will appear here.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 14px' }}>Date</th>
                    <th style={{ padding: '12px 14px' }}>Item Description</th>
                    <th style={{ padding: '12px 14px' }}>Order ID</th>
                    <th style={{ padding: '12px 14px' }}>Amount</th>
                    <th style={{ padding: '12px 14px' }}>Credits Added</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isPaid = tx.status === 'paid'
                    const isFailed = tx.status === 'failed'
                    return (
                      <tr key={tx.id || tx.orderId} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                        <td style={{ padding: '14px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={13} style={{ color: 'var(--text-3)' }} />
                            {formatDate(tx.createdAt)}
                          </div>
                        </td>
                        <td style={{ padding: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
                          {tx.itemName}
                        </td>
                        <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>
                          {tx.orderId}
                        </td>
                        <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-1)' }}>
                          ₹{tx.amount}
                        </td>
                        <td style={{ padding: '14px', color: 'var(--emerald)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          +{tx.creditsAdded} Credits
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: isPaid ? 'var(--emerald-dim)' : isFailed ? 'var(--red-dim)' : 'var(--gold-dim)',
                              color: isPaid ? 'var(--emerald)' : isFailed ? 'var(--red)' : 'var(--gold-hi)',
                              border: `1px solid ${isPaid ? 'var(--emerald-border)' : isFailed ? 'rgba(239,68,68,0.3)' : 'var(--gold-border)'}`,
                            }}
                          >
                            {isPaid ? <CheckCircle2 size={11} /> : isFailed ? <XCircle size={11} /> : <HelpCircle size={11} />}
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {historyTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20 }}>
                  <button
                    onClick={() => loadHistory(Math.max(1, historyPage - 1))}
                    disabled={historyPage <= 1}
                    className="btn-ghost"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                    Page {historyPage} of {historyTotalPages}
                  </span>
                  <button
                    onClick={() => loadHistory(Math.min(historyTotalPages, historyPage + 1))}
                    disabled={historyPage >= historyTotalPages}
                    className="btn-ghost"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={32} style={{ color: 'var(--indigo)', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Loading plans &amp; payment gateway...</p>
        </div>
      ) : activeTab === 'plans' ? (
        /* SUBSCRIPTION PLANS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(plansData.plans || []).map((plan) => {
            const isPopular = (plan.badge || '').toUpperCase().includes('VALUE') || (plan.badge || '').toUpperCase().includes('POPULAR')
            const isProcessing = processingId === plan.id
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
                      <Check size={16} style={{ color: 'var(--emerald)', flexShrink: 0 }} /> All APPSC &amp; TGPSC Subjects
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
                  onClick={() => handlePayWithCashfree(plan)}
                  disabled={isProcessing || verifying}
                  className={isPopular ? 'btn-gold' : 'btn-primary'}
                  style={{ width: '100%', height: 46, fontSize: 14 }}
                >
                  {isProcessing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <CreditCard size={15} /> Pay ₹{plan.price} via Cashfree
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        /* TOP-UP PACKS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(plansData.topups || []).map((topup) => {
            const isProcessing = processingId === topup.id
            return (
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
                  onClick={() => handlePayWithCashfree(topup)}
                  disabled={isProcessing || verifying}
                  className="btn-primary"
                  style={{ width: '100%', height: 46, fontSize: 14 }}
                >
                  {isProcessing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <CreditCard size={15} /> Pay ₹{topup.price} via Cashfree
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer Security Badges & Refund Notice */}
      <div style={{ paddingTop: 28, marginTop: 40, borderTop: '1px solid var(--border-soft)', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
          <strong style={{ color: 'var(--text-1)' }}>Note:</strong> All purchases of AI credits, booster packs, and subscription passes are final and strictly non-refundable once allocated.
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '0 0 10px' }}>
          <ShieldCheck size={14} style={{ display: 'inline', marginRight: 5, color: 'var(--emerald)' }} /> Safe &amp; Secure Cashfree Gateway Checkout · UPI, Cards, Netbanking
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 12, color: 'var(--text-3)' }}>
          <Link to="/refund-policy" style={{ color: 'var(--indigo)', textDecoration: 'underline' }}>Refund &amp; Cancellation Policy</Link>
          <span>•</span>
          <Link to="/terms-and-conditions" style={{ color: 'var(--indigo)', textDecoration: 'underline' }}>Terms of Service</Link>
          <span>•</span>
          <Link to="/privacy-policy" style={{ color: 'var(--indigo)', textDecoration: 'underline' }}>Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}
