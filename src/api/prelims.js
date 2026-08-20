import api from './axiosInstance'

/**
 * Generate 10 MCQ questions for a given topic, exam and language.
 * @param {{ topic: string, exam: string, language?: string }} params
 * @returns {Array} Array of questions
 */
export const generatePrelims = ({ topic, exam, language = 'en' }) =>
  api
    .post('/api/ai/prelims', { topic, exam, language })
    .then((r) => (Array.isArray(r.data) ? r.data : r.data.questions || []))
