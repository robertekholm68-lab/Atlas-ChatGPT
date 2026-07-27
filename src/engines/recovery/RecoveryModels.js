export const clamp = (value, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, Number(value) || 0))
export const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
export const DAY = 86_400_000

export function immutable(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(immutable)
    Object.freeze(value)
  }
  return value
}

export function createRecoverySnapshot(input = {}) {
  return immutable({
    timestamp: new Date(input.timestamp ?? Date.now()).toISOString(),
    recoveryScore: Math.round(clamp(input.recoveryScore)), sleepScore: Math.round(clamp(input.sleepScore)),
    sleepDebt: Math.max(0, Number(input.sleepDebt) || 0), restingHeartRate: Number(input.restingHeartRate) || null,
    HRV: Number(input.HRV ?? input.hrv) || null, stress: input.stress ?? null, fatigue: input.fatigue ?? null,
    trainingLoad: input.trainingLoad ?? null, muscleRecovery: input.muscleRecovery ?? {},
    readiness: input.readiness ?? null, recommendation: input.recommendation ?? null,
    confidence: Math.round(clamp(input.confidence)),
  })
}

export const RecoverySnapshot = createRecoverySnapshot
