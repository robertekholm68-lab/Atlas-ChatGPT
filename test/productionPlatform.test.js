import assert from 'node:assert/strict'
import test from 'node:test'

const memory = new Map()
global.localStorage = {
  getItem: key => memory.has(key) ? memory.get(key) : null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: key => memory.delete(key)
}
global.window = { dispatchEvent() {}, addEventListener() {}, removeEventListener() {}, clearInterval, setInterval }
global.CustomEvent = class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail } }
Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true })

const sync = await import('../src/platform/syncEngine.js')
const errors = await import('../src/platform/errors.js')

test('offline changes are queued with sync status metadata', () => {
  memory.clear()
  const item = sync.enqueueOfflineChange('workout_sessions', 'upsert', { id: 'session-1' })
  assert.equal(item.resource, 'workout_sessions')
  assert.equal(sync.loadQueue().length, 1)
  assert.equal(sync.loadSyncStatus().state, 'offline')
})

test('conflict detection compares local and remote timestamps', () => {
  assert.equal(sync.detectConflict({ updatedAt: '2026-01-01T00:00:00Z' }, { updatedAt: '2026-01-02T00:00:00Z' }), true)
  assert.equal(sync.detectConflict({ updatedAt: '2026-01-03T00:00:00Z' }, { updatedAt: '2026-01-02T00:00:00Z' }), false)
})

test('email validation returns field-level validation errors', () => {
  assert.throws(() => errors.validateEmail('not-an-email'), error => error.kind === errors.ErrorKind.VALIDATION && Boolean(error.fieldErrors.email))
})

test('flush keeps queued changes when a sync service is unavailable', async () => {
  memory.clear()
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true })
  sync.enqueueOfflineChange('workout_sessions', 'upsert', { id: 'session-2' })
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true })
  const status = await sync.flushOfflineQueue({})
  assert.equal(status.state, 'pending')
  assert.equal(sync.loadQueue().length, 1)
  assert.equal(sync.loadQueue()[0].attempts, 1)
})

test('password validation returns field-level validation errors', () => {
  assert.throws(() => errors.validatePassword('short'), error => error.kind === errors.ErrorKind.VALIDATION && Boolean(error.fieldErrors.password))
})
