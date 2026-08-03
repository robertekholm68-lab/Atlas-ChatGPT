import React from 'react'
import ReactDOM from 'react-dom/client'
import AppErrorBoundary from './AppErrorBoundary'
import { RideApp } from './ride/app/RideApp'
import './ride/styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <RideApp />
    </AppErrorBoundary>
  </React.StrictMode>,
)
