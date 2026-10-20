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
 * Create a Cashfree payment order for a plan or top-up item.
 * @param {string} itemId - e.g. 'basic_499', 'pro_999', 'officer_1999', 'topup_149'
 * @param {string} [returnUrl] - Optional custom return URL for redirect
 * @param {string} [customerPhone] - Optional 10-digit mobile number
 */
export const createPaymentOrder = async (itemId, returnUrl, customerPhone) => {
  const res = await api.post('/api/payment/create-order', { itemId, returnUrl, customerPhone })
  return res.data
}

/**
 * Verify Cashfree payment with backend & credit user account.
 * @param {string|Object} params - orderId string or { orderId } object
 */
export const verifyPayment = async (params) => {
  const orderId = typeof params === 'string' ? params : params?.orderId
  const res = await api.post('/api/payment/verify', { orderId })
  return res.data
}

/**
 * Fetch user's transaction and payment history with pagination.
 * @param {Object} options - { page: 1, limit: 10 }
 */
export const getPaymentHistory = async ({ page = 1, limit = 10 } = {}) => {
  const res = await api.get('/api/payment/history', {
    params: { page, limit },
  })
  return res.data
}
