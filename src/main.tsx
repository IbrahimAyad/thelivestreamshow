import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { BroadcastOverlayView } from './components/BroadcastOverlayView.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/broadcast" element={<BroadcastOverlayView />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
