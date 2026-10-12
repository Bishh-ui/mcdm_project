"use client";

import { Component, type ReactNode } from "react";
import { Card } from "./card";
import { Button } from "./button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-4">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try Again
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gray-700 hover:bg-gray-600"
            >
              Reload Page
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
