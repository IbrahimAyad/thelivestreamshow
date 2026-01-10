import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import AdminDashboard from './pages/AdminDashboard'
import { AdminGate } from './components/AdminGate'
import { BroadcastOverlayView } from './components/BroadcastOverlayView'
import { BroadcastVideoPlayer } from './components/BroadcastVideoPlayer'
import Whiteboard from './pages/dashboard/Whiteboard'
import { useEffect, Component, ReactNode } from 'react'

// Global Error Boundary
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#fff', background: '#0a0e17', minHeight: '100vh' }}>
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function AppContent() {
  const location = useLocation()

  useEffect(() => {
    // Add/remove landing page class on body
    const isLandingPage = location.pathname === '/'
    if (isLandingPage) {
      document.body.classList.add('landing-page')
    } else {
      document.body.classList.remove('landing-page')
    }
  }, [location])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin/*" element={
        <AdminGate>
          <AdminDashboard />
        </AdminGate>
      } />
      <Route path="/broadcast" element={<BroadcastOverlayView />} />
      <Route path="/broadcast/video-player" element={<BroadcastVideoPlayer />} />
      <Route path="/whiteboard" element={<Whiteboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
