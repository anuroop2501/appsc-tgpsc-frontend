import api from './axiosInstance'

/**
 * Get paginated study history.
 * @param {Object} params
 * @param {number} params.page   - page number (1-indexed)
 * @param {string} params.type   - 'all' | 'prelims' | 'notes' | 'evaluation'
 */
export const getHistory = ({ page = 1, type = 'all' } = {}) =>
  api.get('/api/history', { params: { page, type } }).then((r) => r.data)

/**
 * Get dashboard statistics.
 * @returns {{ sessionsCount: number, notesCount: number, evalsCount: number }}
 */
export const getStats = () =>
  api.get('/api/history/stats').then((r) => r.data)

/**
 * Get full session details by ID.
 * @param {string} id - Session UUID
 */
export const getSessionDetail = (id) =>
  api.get(`/api/history/${id}`).then((r) => r.data)
