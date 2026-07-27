import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import AppAtlas from './AppAtlas'
import AppErrorBoundary from './AppErrorBoundary'
import './styles.css'
import './workout-mobile-fix.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppAtlas />
    </AppErrorBoundary>
  </React.StrictMode>
)

const isNativeApp = Capacitor.isNativePlatform()

if (isNativeApp) {
  // The installed Android app ships its assets inside the APK. A service worker can
  // otherwise keep serving an older cached web bundle after an APK update.
  window.addEventListener('load', async () => {
    try {
      const registrations = 'serviceWorker' in navigator
        ? await navigator.serviceWorker.getRegistrations()
        : []
      await Promise.all(registrations.map(registration => registration.unregister()))

      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
      }
    } catch (error) {
      console.warn('ASKR could not clear legacy Android web caches.', error)
    }
  })
} else if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`).catch(error => {
      console.warn('ASKR offline support could not be started.', error)
    })
  })
}
