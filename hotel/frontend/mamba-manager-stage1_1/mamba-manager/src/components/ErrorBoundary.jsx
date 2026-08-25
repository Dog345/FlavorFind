import { Component } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Section crashed:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card flex flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-50 text-danger-500">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-ink-900">This section couldn't load</p>
            <p className="mt-1 text-sm text-ink-400">Something went wrong rendering this part of the page.</p>
          </div>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-border px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-surface"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
