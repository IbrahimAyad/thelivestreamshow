import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ControlPanel } from './pages/ControlPanel'
import { BroadcastOverlay } from './pages/BroadcastOverlay'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/control" replace />} />
        <Route path="/control" element={<ControlPanel />} />
        <Route path="/broadcast" element={<BroadcastOverlay />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
