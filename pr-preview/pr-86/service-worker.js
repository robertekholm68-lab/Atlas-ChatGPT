const CACHE_NAME = 'askr-shell-v2'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/assets/branding/logos/askr-symbol-metal.png']

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME)
  const indexResponse = await fetch('/index.html')

  if (!indexResponse.ok) throw new Error('ASKR app shell could not be downloaded')

  const html = await indexResponse.clone().text()
  const assetUrls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map(([, url]) => url)
    .filter(url => url.startsWith('/') && !APP_SHELL.includes(url))

  await cache.put('/index.html', indexResponse)
  await cache.addAll([...new Set([...APP_SHELL.filter(url => url !== '/index.html'), ...assetUrls])])
}

self.addEventListener('install', event => {
  event.waitUntil(cacheAppShell())
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')))
    return
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (!response.ok || response.type !== 'basic') return response
      const copy = response.clone()
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy))
      return response
    }))
  )
})
