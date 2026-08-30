const CACHE_NAME = 'europe-trip-pwa-v2'
const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
]

async function cacheResponse(cache, url) {
  try {
    const response = await fetch(new Request(url, { cache: 'reload' }))
    if (response.ok) await cache.put(url, response.clone())
    return response
  } catch {
    return null
  }
}

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME)
  await Promise.allSettled(APP_SHELL.map(url => cacheResponse(cache, url)))

  const indexResponse = await cacheResponse(cache, '/index.html')
  if (!indexResponse) return

  const html = await indexResponse.text()
  const assetUrls = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map(match => new URL(match[1], self.location.origin))
    .filter(url => url.origin === self.location.origin && url.pathname.startsWith('/assets/'))
    .map(url => url.pathname)

  const currentAssets = new Set(assetUrls)
  await Promise.allSettled([...currentAssets].map(url => cacheResponse(cache, url)))
  const cachedRequests = await cache.keys()
  await Promise.all(cachedRequests
    .filter(request => new URL(request.url).pathname.startsWith('/assets/') && !currentAssets.has(new URL(request.url).pathname))
    .map(request => cache.delete(request)))
}

self.addEventListener('install', event => {
  event.waitUntil(cacheAppShell())
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch {
    return (await cache.match(request)) || (await cache.match('/index.html')) || cache.match('/offline.html')
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(request, response.clone())
  }
  return response
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  event.respondWith(networkFirst(request))
})
