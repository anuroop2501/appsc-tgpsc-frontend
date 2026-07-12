import api from './axiosInstance'
import useAuthStore from '../store/authStore'

/**
 * Evaluate a mains answer.
 * @returns {Object} { score, maxScore, criteria, strengths, improvements, examinerComment, modelAnswer }
 */
export const evaluateAnswer = ({ topic, exam, question, answer, marks }) =>
  api
    .post('/api/ai/evaluate', { topic, exam, question, answer, marks })
    .then((r) => r.data)

/**
 * Upload an image or PDF and extract the written text using Claude Vision.
 * @param {File} file - The file object from an <input type="file"> or drag-and-drop
 * @returns {Object} { success, text, method, chars }
 */
export const extractAnswerFromFile = async (file) => {
  const token = useAuthStore.getState().token
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post('/api/ai/extract-answer', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  return response.data
}
