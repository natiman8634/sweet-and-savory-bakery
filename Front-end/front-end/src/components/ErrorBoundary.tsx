import { Component, type ReactNode } from 'react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleHardReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😵</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-500 mb-6">
              The page crashed unexpectedly. This can happen after multiple
              rapid refreshes or a temporary network issue.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Try Again
              </Button>
              <Button
                onClick={this.handleHardReload}
                variant="outline"
              >
                Reload Page
              </Button>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600">
                  Error details
                </summary>
                <pre className="mt-2 text-xs text-red-500 bg-red-50 p-3 rounded-lg overflow-auto">
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
