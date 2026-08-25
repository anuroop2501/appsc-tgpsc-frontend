import api from './axiosInstance'
import useAuthStore from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || ''

/**
 * Generate 10 MCQ questions with live SSE streaming progress.
 */
export async function generatePrelimsStream({
  topic,
  exam,
  language = 'en',
  onProgress,
  onBatch,
}) {
  const token = useAuthStore.getState().token
  const response = await fetch(`${BASE_URL}/api/ai/prelims`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ topic, exam, language, stream: true }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Request failed with status ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let finalQuestions = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('data:')) {
        try {
          const data = JSON.parse(trimmed.slice(5).trim())
          if (data.type === 'progress') {
            onProgress?.({ progress: data.progress, message: data.message })
          } else if (data.type === 'questions_batch') {
            finalQuestions = data.questions
            onBatch?.(data.questions, data.isFinal)
          } else if (data.type === 'complete') {
            finalQuestions = data.questions
            onProgress?.({ progress: 100, message: 'Done' })
          } else if (data.type === 'error') {
            throw new Error(data.error || 'Prelims generation failed')
          }
        } catch (e) {
          if (e.message && e.message !== 'Unexpected end of JSON input') {
            console.error('[Prelims SSE] parse error:', e)
          }
        }
      }
    }
  }

  if (buffer.trim().startsWith('data:')) {
    try {
      const data = JSON.parse(buffer.trim().slice(5).trim())
      if (data.type === 'complete') {
        finalQuestions = data.questions
      }
    } catch (_) {}
  }

  if (!finalQuestions || !Array.isArray(finalQuestions)) {
    throw new Error('Failed to retrieve full questions set. Please try again.')
  }

  return finalQuestions
}

export const generatePrelims = ({ topic, exam, language = 'en' }) =>
  api
    .post('/api/ai/prelims', { topic, exam, language })
    .then((r) => (Array.isArray(r.data) ? r.data : r.data.questions || []))

