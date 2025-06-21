import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("React error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-900 text-white rounded-lg">
          <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
          <details className="bg-red-950 p-4 rounded">
            <summary className="cursor-pointer">Error details</summary>
            <pre className="mt-2 text-sm">{this.state.error?.toString()}</pre>
          </details>
          <button
            className="mt-4 px-4 py-2 bg-red-700 rounded hover:bg-red-600"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;