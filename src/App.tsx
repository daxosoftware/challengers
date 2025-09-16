import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Header from './components/layout/Header';
import AnimatedBackground from './components/ui/AnimatedBackground';
import { useAuth } from './contexts/AuthContext';
import { useRealtimeSubscriptions } from './hooks/useRealtimeSubscriptions';
import { ErrorBoundary, AuthErrorBoundary } from './components/ErrorBoundary';

// Lazy load components for better performance
const HomePage = lazy(() => import('./components/home/HomePage'));
const TournamentList = lazy(() => import('./components/tournaments/TournamentList'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));

function AppContent() {
  const { loading, user } = useAuth();
  
  // Initialize real-time subscriptions with error handling
  useRealtimeSubscriptions();

  if (loading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center glass-strong p-8 rounded-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-frog-primary mx-auto mb-4"></div>
            <p className="text-white text-gradient-frog font-medium">Chargement...</p>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  return (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // Log to monitoring service in production
            if (process.env.NODE_ENV === 'production') {
              console.error('App Error:', error, errorInfo);
              // Integration with error monitoring service would go here
            }
          }}
        >
          <AnimatedBackground>
            <div className="min-h-screen">
              {/* Skip link for keyboard navigation */}
              <a 
                href="#main-content" 
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-frog-primary text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
              >
                Aller au contenu principal
              </a>
              <Header />
              <main id="main-content" role="main">
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-frog-primary mx-auto mb-4"></div>
                      <p className="text-white/80">Chargement...</p>
                    </div>
                  </div>
                }>
                  <ErrorBoundary
                    resetKeys={user?.id ? [user.id] : []} // Reset error boundary when user changes
                    onError={(error, errorInfo) => {
                      console.error('Route Error:', error, errorInfo);
                    }}
                  >
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/tournaments" element={<TournamentList />} />
                      <Route
                        path="/dashboard"
                        element={user ? <Dashboard /> : <Navigate to="/" replace />}
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </ErrorBoundary>
                </Suspense>
              </main>
            </div>
          </AnimatedBackground>
        </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Global error logging
        console.error('Global App Error:', error, errorInfo);
        
        // Report to monitoring service
        if (process.env.NODE_ENV === 'production') {
          // Example integration with error monitoring
          // errorMonitoringService.captureException(error, { extra: errorInfo });
        }
      }}
    >
      <AuthErrorBoundary>
        <AuthProvider>
          <ToastProvider position="top-right" maxToasts={5}>
            <Router>
              <AppContent />
            </Router>
          </ToastProvider>
        </AuthProvider>
      </AuthErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;