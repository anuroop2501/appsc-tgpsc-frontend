/**
 * sentry.js
 * Initialises Sentry error tracking for the React frontend.
 * Only activates when VITE_SENTRY_DSN is set in frontend/.env
 * Safe no-op in development without a DSN.
 */
import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Capture 10% of performance traces in production
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    // Capture 5% of sessions for Session Replay
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0, // Always capture replay on errors
  })
  console.log('[Sentry] Frontend error tracking initialised.')
}

export default Sentry
