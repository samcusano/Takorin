import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Screen error:', error, info)
  }

  render() {
    if (this.state.error) return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="font-display font-bold italic text-danger text-lg mb-2">Something went wrong</div>
        <div className="font-body italic text-ghost text-[12px] mb-4 max-w-sm leading-relaxed">
          {this.state.error.message}
        </div>
        <button
          onClick={() => this.setState({ error: null })}
          className="font-body text-[11px] px-3 py-1.5 bg-stone3 text-muted"
        >
          Try again
        </button>
      </div>
    )
    return this.props.children
  }
}
