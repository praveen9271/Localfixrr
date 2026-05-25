import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('React error boundary caught:', error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">LocalFixr</p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">Something went wrong</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Please refresh the page. If the issue continues, try logging in again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
            >
              Refresh page
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
