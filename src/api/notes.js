import useAuthStore from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || ''

/**
 * Stream AI-generated notes via SSE (Server-Sent Events).
 *
 * @param {Object}   params
 * @param {string}   params.topic
 * @param {string}   params.exam
 * @param {string}   [params.noteType]
 * @param {Function} onChunk  - called with each text token
 * @param {Function} onDone   - called when stream ends
 * @param {Function} onError  - called with error
 * @returns {Function} abort function to cancel the stream
 */
export const streamNotes = async ({ topic, exam, noteType }, onChunk, onDone, onError) => {
  const token = useAuthStore.getState().token
  const controller = new AbortController()

  try {
    const response = await fetch(`${BASE_URL}/api/ai/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ topic, exam, noteType }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.message || `HTTP ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          onDone && onDone()
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE lines
        const lines = buffer.split('\n')
        // Keep incomplete last line in buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':')) continue

          if (trimmed.startsWith('data:')) {
            const payload = trimmed.slice(5).trim()

            if (payload === '[DONE]') {
              onDone && onDone()
              return
            }

            if (payload) {
              try {
                // Try JSON parse first (in case server wraps in JSON)
                const parsed = JSON.parse(payload)
                const text =
                  parsed.token ||
                  parsed.content ||
                  parsed.text ||
                  (typeof parsed === 'string' ? parsed : '')
                if (text) onChunk(text)
              } catch {
                // Plain text token
                onChunk(payload)
              }
            }
          }
        }
      }
    }

    pump().catch((err) => {
      if (err.name !== 'AbortError') {
        onError && onError(err)
      }
    })
  } catch (err) {
    if (err.name !== 'AbortError') {
      onError && onError(err)
    }
  }

  // Return abort function
  return () => controller.abort()
}
