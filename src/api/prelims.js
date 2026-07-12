import api from './axiosInstance'

/**
 * Generate 10 MCQ questions for a given topic and exam.
 * @returns {Array} Array of { q, opts, ans, exp }
 */
export const generatePrelims = ({ topic, exam }) =>
  api
    .post('/api/ai/prelims', { topic, exam })
    .then((r) => (Array.isArray(r.data) ? r.data : r.data.questions || []))
