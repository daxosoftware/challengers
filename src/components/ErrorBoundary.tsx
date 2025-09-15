import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorHandler } from '../utils/errorHandler';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => prevProps.resetKeys?.[idx] !== key)) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }, 100);
  };

  private reportErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Integration with error monitoring services like Sentry, LogRocket, etc.
    // For now, we'll just log to console
    console.error('Production Error:', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Example Sentry integration:
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   },
    // });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-md w-full">
        <div className="glass-strong rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-red-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            Oups ! Une erreur s'est produite
          </h1>

          <p className="text-white/80 mb-6">
            {isDevelopment && error 
              ? `Erreur: ${error.message}` 
              : 'Quelque chose s\'est mal passé. Veuillez réessayer.'
            }
          </p>

          {isDevelopment && error?.stack && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-white/70 hover:text-white">
                Détails techniques
              </summary>
              <pre className="mt-2 text-xs text-white/60 bg-black/30 p-3 rounded overflow-auto max-h-32">
                {error.stack}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={resetError}
              className="flex-1 bg-gradient-frog-primary hover:bg-gradient-frog-secondary text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Réessayer
            </button>

            <button
              onClick={() => window.location.reload()}
              className="flex-1 glass border-white/20 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 hover:bg-white/10"
            >
              Recharger la page
            </button>
          </div>

          <p className="text-xs text-white/50 mt-4">
            Si le problème persiste, contactez le support technique.
          </p>
        </div>
      </div>
    </div>
  );
}

// Specialized error boundaries for specific use cases
export function AuthErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-strong rounded-2xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-white mb-3">
              Erreur d'authentification
            </h3>
            <p className="text-white/80 text-sm mb-4">
              Une erreur s'est produite lors de l'authentification. Veuillez réessayer.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-frog-primary text-white py-2 px-4 rounded-lg font-medium"
            >
              Recharger
            </button>
          </div>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error('Auth Error:', error, errorInfo);
        // Could send to analytics/monitoring
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export function TournamentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="card-glass p-6 rounded-2xl text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Erreur de chargement du tournoi
          </h3>
          <p className="text-white/70 text-sm mb-4">
            Impossible de charger les données du tournoi.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-frog-primary text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Réessayer
          </button>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error('Tournament Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook for imperative error handling
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    const appError = ErrorHandler.handle(error);
    
    console.error(`Error in ${context || 'component'}:`, appError);
    
    // Could integrate with toast notifications
    // toast.error(appError.message);
    
    return appError;
  };

  return { handleError };
}

// HOC for adding error boundary to any component
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}