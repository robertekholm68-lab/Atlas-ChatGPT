import { average, clamp, immutable } from './RecoveryModels.js'

export function calculateFatigue(input = {}) {
  const workouts = input.workoutHistory || []
  const volumeLoad = clamp(average(workouts.slice(-7).map(item => (Number(item.volume) || Number(item.sets) * 10 || 0))) / 2)
  const intensity = clamp(average(workouts.slice(-7).map(item => (Number(item.intensity ?? item.rpe) || 0) * 10)))
  const frequency = clamp(workouts.slice(-7).length * 14)
  const healthPenalty = 100 - clamp(input.healthScore ?? 75)
  const hrvPenalty = input.baselineHRV ? clamp((1 - (Number(input.HRV ?? input.hrv) || input.baselineHRV) / input.baselineHRV) * 100 + 50) : 50
  const sleepPenalty = 100 - clamp(input.sleepScore ?? 70)
  const stress = clamp(input.stressIndex ?? input.stress ?? 0)
  const heartPenalty = input.baselineRestingHeartRate ? clamp(50 + ((Number(input.restingHeartRate) || input.baselineRestingHeartRate) - input.baselineRestingHeartRate) * 6) : 50
  const systemic = clamp(volumeLoad * .18 + intensity * .18 + frequency * .12 + healthPenalty * .12 + hrvPenalty * .14 + sleepPenalty * .14 + stress * .12)
  const muscles = Object.fromEntries(Object.entries(input.muscleRecovery || {}).map(([id, muscle]) => [id, Math.round(100 - clamp(muscle.recoveryPercentage ?? muscle.score ?? 100))]))
  return immutable({ systemic: Math.round(systemic), muscle: muscles, cardiovascular: Math.round(clamp(hrvPenalty * .55 + heartPenalty * .45)), mental: Math.round(clamp(stress * .65 + sleepPenalty * .35)), overall: Math.round(clamp(systemic * .6 + average(Object.values(muscles)) * .4)), contributors: immutable({ volumeLoad: Math.round(volumeLoad), intensity: Math.round(intensity), frequency: Math.round(frequency), sleep: Math.round(sleepPenalty), stress: Math.round(stress) }) })
}
