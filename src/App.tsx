import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import AdminDashboard from './pages/AdminDashboard'
import { AdminGate } from './components/AdminGate'
import { BroadcastOverlayView } from './components/BroadcastOverlayView'
import { BroadcastVideoPlayer } from './components/BroadcastVideoPlayer'
import Whiteboard from './pages/dashboard/Whiteboard'
import { useEffect } from 'react'

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
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
