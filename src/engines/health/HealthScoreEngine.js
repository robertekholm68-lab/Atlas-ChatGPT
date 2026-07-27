import { deepFreeze } from './HealthModels.js'

export const HEALTH_SCORE_WEIGHTS = Object.freeze({ sleep: 0.25, hrv: 0.2, restingHeartRate: 0.15, stress: 0.15, trainingLoad: 0.1, activity: 0.15 })
const clamp = value => Math.min(100, Math.max(0, value))
const scoreRange = (value, low, high, invert = false) => {
  const score = clamp(((Number(value) - low) / (high - low)) * 100)
  return invert ? 100 - score : score
}

export function calculateHealthScore(snapshot = {}, options = {}) {
  const baselines = options.baselines || {}
  const components = {
    sleep: snapshot.sleepScore ?? (snapshot.sleepDuration == null ? null : scoreRange(snapshot.sleepDuration, 4, 9)),
    hrv: snapshot.heartRateVariability == null ? null : scoreRange(snapshot.heartRateVariability, baselines.hrvLow ?? 20, baselines.hrvHigh ?? 100),
    restingHeartRate: snapshot.restingHeartRate == null ? null : scoreRange(snapshot.restingHeartRate, baselines.restingHeartRateLow ?? 45, baselines.restingHeartRateHigh ?? 90, true),
    stress: snapshot.stressScore == null ? null : 100 - clamp(snapshot.stressScore),
    trainingLoad: snapshot.trainingLoad == null ? null : 100 - Math.min(100, Math.abs(snapshot.trainingLoad - (baselines.trainingLoadTarget ?? 60)) * 2.5),
    activity: snapshot.steps == null && snapshot.activeCalories == null ? null : Math.max(scoreRange(snapshot.steps ?? 0, 1000, 10000), scoreRange(snapshot.activeCalories ?? 0, 100, 700)),
  }
  const available = Object.entries(components).filter(([, value]) => Number.isFinite(Number(value)))
  const weight = available.reduce((sum, [name]) => sum + HEALTH_SCORE_WEIGHTS[name], 0)
  const score = weight ? Math.round(available.reduce((sum, [name, value]) => sum + clamp(value) * HEALTH_SCORE_WEIGHTS[name], 0) / weight) : 0
  const strongest = [...available].sort((left, right) => right[1] - left[1])[0]
  const weakest = [...available].sort((left, right) => left[1] - right[1])[0]
  return deepFreeze({ score, coverage: Math.round(weight * 100), components, explanation: available.length ? { summary: score >= 80 ? 'Health signals are strong.' : score >= 60 ? 'Health signals are generally balanced.' : 'Health signals suggest additional recovery.', strongest: strongest?.[0] ?? null, limiting: weakest?.[0] ?? null } : { summary: 'Not enough health data to calculate a score.', strongest: null, limiting: null } })
}

