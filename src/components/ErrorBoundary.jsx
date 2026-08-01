import React from 'react'
import { AlertTriangle, RotateCcw, LayoutDashboard } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught UI error:', error, errorInfo)
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#131826', color: '#E2E8F0' }}>
          <div
            className="max-w-md w-full p-8 rounded-3xl text-center space-y-5 animate-scale-up"
            style={{
              background: 'rgba(30,38,58,0.7)',
              border: '1px solid rgba(247,111,111,0.3)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'rgba(247,111,111,0.15)', color: '#F76F6F' }}
            >
              <AlertTriangle size={32} />
            </div>

            <div>
              <h2 className="text-xl font-extrabold" style={{ fontFamily: 'Sora, sans-serif' }}>
                Something went wrong in this view
              </h2>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: '#94A3B8' }}>
                An unexpected component rendering error occurred. Don't worry, your progress and session data are safe.
              </p>
            </div>

            {this.state.error?.message && (
              <div
                className="p-3 rounded-xl text-left text-[11px] font-mono overflow-x-auto"
                style={{ background: 'rgba(0,0,0,0.4)', color: '#F76F6F', border: '1px solid rgba(247,111,111,0.2)' }}
              >
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #4F8EF7, #7B5EF8)', color: '#FFFFFF' }}
              >
                <RotateCcw size={15} /> Reload View
              </button>
              <a
                href="/dashboard"
                className="flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <LayoutDashboard size={15} /> Dashboard
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
