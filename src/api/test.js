import api from './axiosInstance'

/**
 * Initiate an asynchronous test generation job.
 * @param {{ exam: string, questionCount: 50|100|200, durationMinutes: 30|60|120, language?: string }} params
 * @returns {Promise<{ success: boolean, jobId: string }>}
 */
export const startTestJob = async ({ exam, questionCount, durationMinutes, language = 'en' }) => {
  const res = await api.post('/api/ai/test/start', { exam, questionCount, durationMinutes, language })
  return res.data
}

/**
 * Retrieve status of an active test generation job.
 * @param {string} jobId
 * @returns {Promise<object>}
 */
export const getTestJobStatus = async (jobId) => {
  const res = await api.get(`/api/ai/test/status/${jobId}`)
  return res.data
}

/**
 * Submit test results (score, answers, time taken).
 * @param {string} testId
 * @param {Object} answers - { questionIndex: optionIndex }
 * @param {number} timeTakenSecs
 */
export const submitTestResults = async (testId, answers, timeTakenSecs) => {
  const res = await api.post('/api/ai/test/submit', { testId, answers, timeTakenSecs })
  return res.data
}

/**
 * Get user's test history list.
 * @returns {Promise<{ success: boolean, tests: Array }>}
 */
export const getTestHistory = async () => {
  const res = await api.get('/api/ai/test/history')
  return res.data
}

/**
 * Get full test detail for review (questions + answers).
 * @param {string} testId
 * @returns {Promise<{ success: boolean, test: object, questions: Array }>}
 */
export const getTestDetail = async (testId) => {
  const res = await api.get(`/api/ai/test/history/${testId}`)
  return res.data
}
