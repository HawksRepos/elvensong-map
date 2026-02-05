import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Map error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-screen h-screen bg-dark-bg flex items-center justify-center">
          <div className="bg-dark-panel p-8 rounded-lg shadow-xl max-w-md text-center">
            <h2 className="text-xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-gray-400 mb-4">
              The map encountered an error. Try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-accent-blue text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-gray-500 cursor-pointer">Error details</summary>
                <pre className="mt-2 text-xs text-red-400 overflow-auto max-h-32 bg-dark-bg p-2 rounded">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
