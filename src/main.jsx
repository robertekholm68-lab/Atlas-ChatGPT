import React from 'react'
import ReactDOM from 'react-dom/client'
import AppAtlas from './AppAtlas'
import AppErrorBoundary from './AppErrorBoundary'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppAtlas />
    </AppErrorBoundary>
  </React.StrictMode>
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`).catch(error => {
      console.warn('ASKR offline support could not be started.', error)
    })
  })
}
