import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { restorePagesRoute } from './lib/pages-routing.js'

// GitHub Pages sends deep-link refreshes through 404.html and back to the root.
// Restore the original URL before BrowserRouter reads it.
restorePagesRoute(window, import.meta.env.BASE_URL)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
