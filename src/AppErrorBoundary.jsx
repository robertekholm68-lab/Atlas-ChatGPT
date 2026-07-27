import React from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default class AppErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ASKR could not render the current view.', error, errorInfo)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="app-error" role="alert" aria-labelledby="app-error-title">
        <AlertCircle aria-hidden="true" size={32} />
        <h1 id="app-error-title">Något gick fel</h1>
        <p>Dina lokala träningsdata är kvar. Ladda om ASKR för att försöka igen.</p>
        <button type="button" onClick={() => window.location.reload()}>
          <RotateCcw aria-hidden="true" size={18} />
          Ladda om ASKR
        </button>
      </main>
    )
  }
}
