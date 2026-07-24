const DEFAULT_REST_SECONDS = 90

function safePositiveSeconds(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback
}

function safeTimestamp(value, fallback = null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function createRestTimer(durationSeconds = DEFAULT_REST_SECONDS, now = Date.now()) {
  const duration = safePositiveSeconds(durationSeconds, DEFAULT_REST_SECONDS) || DEFAULT_REST_SECONDS
  const startedAt = safeTimestamp(now, Date.now())
  return { durationSeconds: duration, endsAt: startedAt + duration * 1000, status: 'running' }
}

export function remainingRestSeconds(timer, now = Date.now()) {
  if (!timer || typeof timer !== 'object') return 0
  if (timer.status === 'paused') return safePositiveSeconds(timer.remainingSeconds, 0)
  if (timer.status === 'completed') return 0
  const endsAt = safeTimestamp(timer.endsAt, null)
  if (!endsAt) return 0
  return Math.max(0, Math.ceil((endsAt - safeTimestamp(now, Date.now())) / 1000))
}

export function normalizeRestTimer(timer, now = Date.now()) {
  if (!timer || typeof timer !== 'object') return null
  const durationSeconds = safePositiveSeconds(timer.durationSeconds, DEFAULT_REST_SECONDS) || DEFAULT_REST_SECONDS
  const remainingSeconds = remainingRestSeconds(timer, now)
  if (timer.status === 'paused') return { durationSeconds, endsAt: null, status: 'paused', remainingSeconds }
  if (timer.status === 'completed' || remainingSeconds <= 0) return { durationSeconds, endsAt: safeTimestamp(timer.endsAt, null), status: 'completed' }
  return { durationSeconds, endsAt: safeTimestamp(timer.endsAt, safeTimestamp(now, Date.now()) + durationSeconds * 1000), status: 'running' }
}

export function pauseRestTimer(timer, now = Date.now()) {
  const normalized = normalizeRestTimer(timer, now)
  if (!normalized || normalized.status === 'completed') return normalized
  return { durationSeconds: normalized.durationSeconds, endsAt: null, status: 'paused', remainingSeconds: remainingRestSeconds(normalized, now) }
}

export function resumeRestTimer(timer, now = Date.now()) {
  const normalized = normalizeRestTimer(timer, now)
  if (!normalized || normalized.status === 'completed') return normalized
  const remainingSeconds = safePositiveSeconds(normalized.remainingSeconds ?? remainingRestSeconds(normalized, now), 0)
  if (remainingSeconds <= 0) return { durationSeconds: normalized.durationSeconds, endsAt: safeTimestamp(now, Date.now()), status: 'completed' }
  const startedAt = safeTimestamp(now, Date.now())
  return { durationSeconds: normalized.durationSeconds, endsAt: startedAt + remainingSeconds * 1000, status: 'running' }
}

export function extendRestTimer(timer, seconds = 30, now = Date.now()) {
  const addSeconds = safePositiveSeconds(seconds, 30) || 30
  const normalized = normalizeRestTimer(timer, now) || createRestTimer(0, now)
  if (normalized.status === 'paused') return { ...normalized, remainingSeconds: remainingRestSeconds(normalized, now) + addSeconds }
  const currentRemaining = remainingRestSeconds(normalized, now)
  const startedAt = safeTimestamp(now, Date.now())
  return { durationSeconds: normalized.durationSeconds + addSeconds, endsAt: startedAt + (currentRemaining + addSeconds) * 1000, status: 'running' }
}

export function skipRestTimer(timer, now = Date.now()) {
  const normalized = normalizeRestTimer(timer, now) || createRestTimer(0, now)
  return { durationSeconds: normalized.durationSeconds, endsAt: safeTimestamp(now, Date.now()), status: 'completed' }
}

export function formatRestTime(seconds) {
  const safeSeconds = safePositiveSeconds(seconds, 0)
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`
}
