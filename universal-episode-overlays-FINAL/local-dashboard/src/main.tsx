import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { BroadcastViewEnhanced } from './components/BroadcastViewEnhanced.tsx'
import { SceneProvider } from './contexts/SceneContext.tsx'
import { ShowProvider } from './contexts/ShowContext.tsx'
import { LowerThirdProvider } from './contexts/LowerThirdContext.tsx'
import { DiscordProvider } from './contexts/DiscordContext.tsx'
import { PresetProvider } from './contexts/PresetContext.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ShowProvider>
          <SceneProvider>
            <LowerThirdProvider>
              <DiscordProvider>
                <PresetProvider>
                  <Routes>
                    <Route path="/" element={<App />} />
                    <Route path="/broadcast" element={<BroadcastViewEnhanced />} />
                  </Routes>
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#1a1a1a',
                    color: '#fff',
                    border: '1px solid #3a3a3a',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
                </PresetProvider>
              </DiscordProvider>
            </LowerThirdProvider>
          </SceneProvider>
        </ShowProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
