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
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      // You can render a custom fallback UI here
      return this.props.fallback || (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
          <div className="bg-red-900/50 rounded-lg p-6 max-w-md shadow-xl border border-red-800">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="mb-4">
              We apologize for the inconvenience. Please try refreshing the page or coming back later.
            </p>
            <details className="bg-gray-800/50 p-3 rounded text-sm font-mono overflow-auto">
              <summary className="cursor-pointer mb-2">Technical Details</summary>
              <p className="text-red-400">{this.state.error?.toString()}</p>
            </details>
            <button
              className="mt-6 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 