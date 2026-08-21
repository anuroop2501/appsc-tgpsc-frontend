import api from './axiosInstance'

/**
 * Get paginated study history.
 * @param {Object} params
 * @param {number} params.page   - page number (1-indexed)
 * @param {number} params.limit  - items per page (default 10)
 * @param {string} params.type   - 'all' | 'prelims' | 'notes' | 'evaluation'
 */
export const getHistory = ({ page = 1, limit = 10, type = 'all' } = {}) =>
  api.get('/api/history', { params: { page, limit, type } }).then((r) => r.data)

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

/**
 * Regenerate content for an expired history session and save permanently.
 * @param {string} id - Session UUID
 */
export const regenerateSession = (id) =>
  api.post(`/api/history/regenerate/${id}`).then((r) => r.data)
