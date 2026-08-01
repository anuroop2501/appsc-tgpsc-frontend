import api from './axiosInstance'

/**
 * Fetch available subscription plans and top-up credit packs.
 */
export const getPaymentPlans = async () => {
  const res = await api.get('/api/payment/plans')
  return res.data
}

/**
 * Fetch user's current credit balance and plan tier.
 */
export const getUserBalance = async () => {
  const res = await api.get('/api/payment/user-balance')
  return res.data
}

/**
 * Create a payment order for a plan or top-up item.
 * @param {string} itemId - e.g. 'basic_499', 'pro_999', 'officer_1999', 'topup_149'
 */
export const createPaymentOrder = async (itemId) => {
  const res = await api.post('/api/payment/create-order', { itemId })
  return res.data
}

/**
 * Verify Razorpay payment signature & credit account.
 */
export const verifyPayment = async ({ orderId, paymentId, signature }) => {
  const res = await api.post('/api/payment/verify', { orderId, paymentId, signature })
  return res.data
}
