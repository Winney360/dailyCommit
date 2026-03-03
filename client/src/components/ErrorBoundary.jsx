import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-base px-6">
          <div className="text-center max-w-sm">
            <h1 className="text-4xl font-bold text-primary mb-4">Something went wrong</h1>
            <p className="text-muted mb-8">We're sorry, but something unexpected happened.</p>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors">
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
