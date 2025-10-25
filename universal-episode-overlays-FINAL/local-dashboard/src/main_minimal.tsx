import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Minimal setup without providers to test tab switching
createRoot(document.getElementById('root')!).render(<App />)
