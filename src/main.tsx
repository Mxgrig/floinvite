/**
 * Floinvite Entry Point
 * React 19 with Vite
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/mobile-responsive.css'
import './styles/pages-mobile.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
