/**
 * Authentication Context
 * Provides user authentication state and host identification
 */

import { createContext, useContext, useState, useEffect, ReactNode, Component, ErrorInfo } from 'react';
import { createClient } from '@supabase/supabase-js';

interface AuthContextValue {
  userId: string | null;
  hostId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check current auth session
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          setUserId(session.user.id);
          setHostId(session.user.id); // For now, userId = hostId
        } else {
          // For development: create a mock session if no auth
          const mockUserId = localStorage.getItem('dev_user_id') || `dev_user_${Date.now()}`;
          localStorage.setItem('dev_user_id', mockUserId);
          setUserId(mockUserId);
          setHostId(mockUserId);
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');

        // Fallback to dev mode
        const mockUserId = localStorage.getItem('dev_user_id') || `dev_user_${Date.now()}`;
        localStorage.setItem('dev_user_id', mockUserId);
        setUserId(mockUserId);
        setHostId(mockUserId);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setHostId(session.user.id);
      } else {
        setUserId(null);
        setHostId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    userId,
    hostId,
    isAuthenticated: !!userId,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Error Boundary for AuthProvider
 * Catches errors in authentication and provides fallback UI
 */
interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AuthErrorBoundary extends Component<{ children: ReactNode }, AuthErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AuthContext Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
          <div className="max-w-md w-full bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-300 mb-2">Authentication Error</h2>
            <p className="text-gray-300 text-sm mb-4">
              {this.state.error?.message || 'An error occurred in the authentication system.'}
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors"
            >
              Clear Data & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * AuthProvider wrapped with ErrorBoundary
 * Use this as the default export
 */
export function AuthProviderWithBoundary({ children }: AuthProviderProps) {
  return (
    <AuthErrorBoundary>
      <AuthProvider>{children}</AuthProvider>
    </AuthErrorBoundary>
  );
}
