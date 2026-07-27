export const HEALTH_FIELDS = Object.freeze([
  'restingHeartRate', 'heartRateVariability', 'sleepDuration', 'sleepScore',
  'stressScore', 'steps', 'activeCalories', 'bodyWeight', 'bodyFat',
  'hydration', 'energyLevel', 'trainingLoad',
])

export const HEALTH_SOURCES = Object.freeze({
  APPLE_HEALTH: 'apple_health',
  HEALTH_CONNECT: 'health_connect',
  GARMIN: 'garmin',
  FITBIT: 'fitbit',
  POLAR: 'polar',
  OURA: 'oura',
  MANUAL: 'manual',
})

const finiteOrNull = value => {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.values(value).forEach(deepFreeze)
  return Object.freeze(value)
}

/** Canonical, immutable physiological reading consumed by all health engines. */
export function createHealthSnapshot(input = {}) {
  const date = new Date(input.timestamp ?? Date.now())
  if (Number.isNaN(date.getTime())) throw new TypeError('HealthSnapshot requires a valid timestamp')
  const source = Object.values(HEALTH_SOURCES).includes(input.source) ? input.source : HEALTH_SOURCES.MANUAL
  const snapshot = { timestamp: date.toISOString() }
  for (const field of HEALTH_FIELDS) snapshot[field] = finiteOrNull(input[field])
  snapshot.source = source
  snapshot.externalId = input.externalId == null ? null : String(input.externalId)
  return deepFreeze(snapshot)
}

export const healthSnapshotKey = snapshot => snapshot.externalId
  ? `${snapshot.source}:${snapshot.externalId}`
  : `${snapshot.source}:${snapshot.timestamp}`

