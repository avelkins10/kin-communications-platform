'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from 'lucide-react';
import { logger } from '@/lib/logging/browser-logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Log the error
    logger.error('React Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          errorBoundary: true,
          errorId,
        },
        extra: {
          componentStack: errorInfo.componentStack,
        },
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = async () => {
    const { error, errorInfo, errorId } = this.state;
    
    const errorReport = {
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
      componentStack: errorInfo?.componentStack,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy error report:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId, copied } = this.state;
      const { showDetails = process.env.NODE_ENV === 'development' } = this.props;

      return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${this.props.className || ''}`}>
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription>
                We're sorry, but something unexpected happened. Our team has been notified.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {errorId && (
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Error ID: <code className="font-mono text-xs">{errorId}</code>
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleRetry} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                
                <Button variant="outline" onClick={this.handleReload} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                
                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {showDetails && error && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Bug className="h-5 w-5" />
                      Error Details
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={this.handleCopyError}
                      className="flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Error
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Error Message</h4>
                      <div className="rounded-md bg-muted p-3 font-mono text-sm">
                        {error.message}
                      </div>
                    </div>
                    
                    {error.stack && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Stack Trace</h4>
                        <div className="rounded-md bg-muted p-3 font-mono text-xs overflow-auto max-h-40">
                          <pre className="whitespace-pre-wrap">{error.stack}</pre>
                        </div>
                      </div>
                    )}
                    
                    {errorInfo?.componentStack && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Component Stack</h4>
                        <div className="rounded-md bg-muted p-3 font-mono text-xs overflow-auto max-h-40">
                          <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  If this problem persists, please contact support with the Error ID above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional error boundary hook
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
    logger.error('Error captured by useErrorHandler', {
      error: error.message,
      stack: error.stack,
    });
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

// Error boundary for specific components
export function ComponentErrorBoundary({ 
  children, 
  componentName,
  fallback 
}: { 
  children: ReactNode;
  componentName: string;
  fallback?: ReactNode;
}) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.error(`Error in component: ${componentName}`, {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }}
      fallback={fallback}
    >
      {children}
    </ErrorBoundary>
  );
}

// Async error boundary for handling async errors
export function AsyncErrorBoundary({
  children,
  onError
}: {
  children: ReactNode;
  onError?: (error: Error) => void;
}) {
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = new Error(event.message);
      error.stack = event.error?.stack;

      if (onError) {
        onError(error);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

      if (onError) {
        onError(error);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  return <>{children}</>;
}

export default ErrorBoundary;




