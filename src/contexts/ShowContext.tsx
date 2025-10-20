/**
 * Show Context
 * Provides active show state and control
 */

import { createContext, useContext, useState, useEffect, ReactNode, Component, ErrorInfo } from 'react';

interface ShowContextValue {
  showId: string | null;
  showTitle: string | null;
  isLive: boolean;
  startShow: (id: string, title: string) => void;
  endShow: () => void;
  updateShowId: (id: string) => void;
}

const ShowContext = createContext<ShowContextValue | undefined>(undefined);

interface ShowProviderProps {
  children: ReactNode;
}

export function ShowProvider({ children }: ShowProviderProps) {
  const [showId, setShowId] = useState<string | null>(null);
  const [showTitle, setShowTitle] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  // Restore show state from localStorage on mount
  useEffect(() => {
    const savedShowId = localStorage.getItem('active_show_id');
    const savedShowTitle = localStorage.getItem('active_show_title');
    const savedIsLive = localStorage.getItem('active_show_is_live') === 'true';

    if (savedShowId) {
      setShowId(savedShowId);
      setShowTitle(savedShowTitle);
      setIsLive(savedIsLive);
    }
  }, []);

  /**
   * Start a new show
   */
  const startShow = (id: string, title: string) => {
    setShowId(id);
    setShowTitle(title);
    setIsLive(true);

    // Persist to localStorage
    localStorage.setItem('active_show_id', id);
    localStorage.setItem('active_show_title', title);
    localStorage.setItem('active_show_is_live', 'true');
  };

  /**
   * End the current show
   */
  const endShow = () => {
    setShowId(null);
    setShowTitle(null);
    setIsLive(false);

    // Clear localStorage
    localStorage.removeItem('active_show_id');
    localStorage.removeItem('active_show_title');
    localStorage.removeItem('active_show_is_live');
  };

  /**
   * Update show ID without changing live status
   */
  const updateShowId = (id: string) => {
    setShowId(id);
    if (id) {
      localStorage.setItem('active_show_id', id);
    }
  };

  const value: ShowContextValue = {
    showId,
    showTitle,
    isLive,
    startShow,
    endShow,
    updateShowId
  };

  return (
    <ShowContext.Provider value={value}>
      {children}
    </ShowContext.Provider>
  );
}

/**
 * Hook to use show context
 */
export function useShow() {
  const context = useContext(ShowContext);

  if (context === undefined) {
    throw new Error('useShow must be used within a ShowProvider');
  }

  return context;
}

/**
 * Error Boundary for ShowProvider
 * Catches errors in show management and provides fallback UI
 */
interface ShowErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ShowErrorBoundary extends Component<{ children: ReactNode }, ShowErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ShowErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ShowContext Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
          <div className="max-w-md w-full bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-300 mb-2">Show Management Error</h2>
            <p className="text-gray-300 text-sm mb-4">
              {this.state.error?.message || 'An error occurred in the show management system.'}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('active_show_id');
                localStorage.removeItem('active_show_title');
                localStorage.removeItem('active_show_is_live');
                window.location.reload();
              }}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors"
            >
              Clear Show Data & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * ShowProvider wrapped with ErrorBoundary
 * Use this as the default export
 */
export function ShowProviderWithBoundary({ children }: ShowProviderProps) {
  return (
    <ShowErrorBoundary>
      <ShowProvider>{children}</ShowProvider>
    </ShowErrorBoundary>
  );
}
