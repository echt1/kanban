import React from 'react'
import ReactDOM from 'react-dom/client'
import { initDiscord } from './discord'
import App from './App.jsx'
import './fonts.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

initDiscord()
