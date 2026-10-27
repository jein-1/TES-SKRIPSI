import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[A.T.L.A.S ErrorBoundary] Uncaught runtime exception:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#07090E] text-white flex flex-col items-center justify-center p-6 text-center font-mono z-[9999]">
          <div className="w-12 h-12 rounded-xl bg-[#0E121B] border border-[#FF5722]/50 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(255,87,34,0.3)]">
            <span className="text-[#FF5722] text-xl font-black">!</span>
          </div>
          <h1 className="text-sm font-bold text-[#FF5722] tracking-widest mb-1 uppercase">
            A.T.L.A.S // SYSTEM RECOVERY
          </h1>
          <p className="text-xs text-slate-400 mb-4 max-w-xs font-sans">
            Sistem mendeteksi anomali pada siklus render antarmuka. Tekan tombol di bawah untuk inisialisasi ulang.
          </p>
          {this.state.error && (
            <pre className="text-[10px] text-red-400 bg-black/80 p-3 rounded border border-red-900/50 max-w-sm overflow-x-auto mb-4 text-left whitespace-pre-wrap">
              {this.state.error.message || String(this.state.error)}
            </pre>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            className="px-4 py-2 bg-[#FF5722] hover:bg-[#e64a19] text-black font-bold text-xs rounded transition-colors uppercase tracking-wider"
          >
            Muat Ulang Sistem
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
