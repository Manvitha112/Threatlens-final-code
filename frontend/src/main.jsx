import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1E293B',
          color: '#E2E8F0',
          border: '1px solid #334155',
          fontSize: '13px',
          borderRadius: '10px',
        },
        success: {
          iconTheme: { primary: '#22C55E', secondary: '#1E293B' }
        },
        error: {
          iconTheme: { primary: '#EF4444', secondary: '#1E293B' }
        }
      }}
    />
  </StrictMode>
)