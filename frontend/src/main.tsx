import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyTheme } from './useTheme'
import './index.css'
import App from './App.tsx'

const stored = localStorage.getItem('neobank-theme')
const initial = stored === 'light' || stored === 'dark' ? stored : 'dark'
applyTheme(initial)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
