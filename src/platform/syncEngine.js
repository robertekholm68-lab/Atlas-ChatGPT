import { AtlasError, ErrorKind } from './errors.js'

const QUEUE_KEY = 'atlas-offline-queue-v1'
const SYNC_KEY = 'atlas-sync-status-v1'

export function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] }
}

export function saveQueue(queue) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)) } catch { /* Offline queue is best-effort when storage is unavailable. */ }
}

export function loadSyncStatus() {
  try { return JSON.parse(localStorage.getItem(SYNC_KEY) || '{}') } catch { return {} }
}

export function saveSyncStatus(status) {
  const next = { lastSyncAt: null, state: 'idle', pending: loadQueue().length, ...loadSyncStatus(), ...status }
  try { localStorage.setItem(SYNC_KEY, JSON.stringify(next)) } catch { /* Sync status remains in-memory only. */ }
  window.dispatchEvent(new CustomEvent('atlas:sync-status', { detail: next }))
  return next
}

export function enqueueOfflineChange(resource, operation, payload) {
  const queue = loadQueue()
  const item = { id: crypto.randomUUID(), resource, operation, payload, attempts: 0, createdAt: new Date().toISOString() }
  queue.push(item)
  saveQueue(queue)
  saveSyncStatus({ state: navigator.onLine ? 'pending' : 'offline', pending: queue.length })
  return item
}

export function detectConflict(localRecord, remoteRecord) {
  if (!localRecord?.updatedAt || !remoteRecord?.updatedAt) return false
  return new Date(localRecord.updatedAt).getTime() < new Date(remoteRecord.updatedAt).getTime()
}

export async function flushOfflineQueue(services) {
  if (!navigator.onLine) throw new AtlasError(ErrorKind.OFFLINE, 'Offline', { retryable: true })
  const queue = loadQueue()
  saveSyncStatus({ state: 'syncing', pending: queue.length })
  const remaining = []
  for (const item of queue) {
    try {
      const service = services[item.resource]
      if (!service?.applyQueuedChange) throw new AtlasError(ErrorKind.SERVER, `Missing sync service for ${item.resource}`, { retryable: true })
      await service.applyQueuedChange(item)
    } catch (error) {
      remaining.push({ ...item, attempts: item.attempts + 1, lastError: error.message })
    }
  }
  saveQueue(remaining)
  return saveSyncStatus({ state: remaining.length ? 'pending' : 'synced', pending: remaining.length, lastSyncAt: new Date().toISOString() })
}

export function installBackgroundSync(services) {
  const sync = () => flushOfflineQueue(services).catch(() => saveSyncStatus({ state: navigator.onLine ? 'pending' : 'offline' }))
  window.addEventListener('online', sync)
  window.addEventListener('offline', () => saveSyncStatus({ state: 'offline' }))
  const interval = window.setInterval(sync, 30000)
  sync()
  return () => { window.removeEventListener('online', sync); window.clearInterval(interval) }
}
