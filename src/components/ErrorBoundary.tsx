import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const serializeError = (error: any) => {
  if (error instanceof Error) {
    return error.message + '\n' + error.stack;
  }
  return JSON.stringify(error, null, 2);
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
  sectionName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error(`[ErrorBoundary${this.props.sectionName ? ` - ${this.props.sectionName}` : ''}]:`, error, errorInfo);

    this.setState({
      errorInfo
    });

    // Here you could also log to an error reporting service
    // e.g., Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-[200px] p-6">
          <div className="max-w-2xl w-full bg-red-500/10 border border-red-500/20 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-red-500 mb-2">
                  {this.props.sectionName ? `${this.props.sectionName} Error` : 'Something went wrong'}
                </h2>
                <p className="text-sm text-gray-300 mb-4">
                  This section encountered an error and couldn't be displayed. Other parts of the dashboard should still work.
                </p>

                <details className="mb-4">
                  <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs bg-black/30 p-3 rounded overflow-auto max-h-40 text-gray-400">
                    {serializeError(this.state.error)}
                  </pre>
                </details>

                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}