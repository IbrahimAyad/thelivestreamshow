import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { BroadcastOverlayView } from './components/BroadcastOverlayView.tsx'
import { BroadcastVideoPlayer } from './components/BroadcastVideoPlayer.tsx'
import Whiteboard from './pages/dashboard/Whiteboard.tsx'
import { initMonitoring } from './lib/monitoring/sentry'
import { MusicProvider } from './contexts/MusicProvider'

// Initialize error monitoring
initMonitoring()

createRoot(document.getElementById('root')!).render(
  // StrictMode disabled for performance - causes double mounting in dev
  // <StrictMode>
    <MusicProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/broadcast" element={<BroadcastOverlayView />} />
          <Route path="/broadcast/video-player" element={<BroadcastVideoPlayer />} />
          <Route path="/whiteboard" element={<Whiteboard />} />
        </Routes>
      </BrowserRouter>
    </MusicProvider>
  // </StrictMode>,
)
