import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="center-page" role="alert" aria-live="assertive">
          <div className="simple-card" style={{ maxWidth: 480, textAlign: 'center', padding: 32 }}>
            <div
              className="empty-orb"
              style={{
                background: 'var(--danger-subtle, #fee2e2)',
                color: 'var(--danger, #dc2626)',
                margin: '0 auto 16px auto',
              }}
            >
              <AlertTriangle size={28} />
            </div>
            <h2 style={{ marginBottom: 8, fontSize: '1.4rem' }}>Something went wrong</h2>
            <p style={{ color: 'var(--foreground-muted)', fontSize: '0.92rem', marginBottom: 20 }}>
              An unexpected error occurred while rendering this view. You can reload the page or
              navigate back to the home screen.
            </p>
            {this.state.error?.message && (
              <pre
                style={{
                  background: 'var(--surface-sunken, #f8fafc)',
                  padding: 12,
                  borderRadius: 6,
                  fontSize: '0.8rem',
                  color: 'var(--foreground-muted)',
                  overflowX: 'auto',
                  textAlign: 'left',
                  marginBottom: 20,
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn secondary"
                onClick={this.handleReload}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={15} /> Reload Page
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={this.handleGoHome}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Home size={15} /> Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
