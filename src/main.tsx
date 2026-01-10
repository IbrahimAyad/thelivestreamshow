import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initMonitoring } from './lib/monitoring/sentry'
import { MusicProvider } from './contexts/MusicProvider'

// Initialize error monitoring
initMonitoring()

createRoot(document.getElementById('root')!).render(
  // StrictMode disabled for performance - causes double mounting in dev
  // <StrictMode>
    <MusicProvider>
      <App />
    </MusicProvider>
  // </StrictMode>,
)
