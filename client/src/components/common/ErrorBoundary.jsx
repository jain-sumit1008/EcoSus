import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-page flex items-center justify-center p-6 text-center">
          <div className="card max-w-lg p-8 shadow-card border-line space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-error shadow-sm">
              <AlertTriangle size={28} />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-ink">Something went wrong</h2>
              <p className="mt-1 text-xs text-muted">
                An unexpected interface error occurred. You can reload the page or reset the local session.
              </p>
            </div>

            {this.state.error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-left font-mono text-[11px] text-error max-h-36 overflow-y-auto">
                <p className="font-bold">{this.state.error.toString()}</p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-primary text-xs px-4 py-2.5 bg-forest hover:bg-forest/90 font-bold flex items-center gap-1.5"
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="btn-outline text-xs px-4 py-2.5 flex items-center gap-1.5 font-bold"
              >
                <Home size={14} />
                <span>Reset & Go to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
