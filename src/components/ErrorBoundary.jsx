import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#fee', minHeight: '100vh' }}>
          <h1 style={{ color: '#c00' }}>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#333', fontSize: 14 }}>
            {this.state.error?.toString()}
          </pre>
          <details style={{ marginTop: 16 }}>
            <summary>Component Stack</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
