import { clamp, immutable } from './RecoveryModels.js'

export function calculateRecoveryScore(input = {}) {
  const factors = {
    sleep: Number(input.sleepScore ?? 70), hrv: Number(input.hrvScore ?? input.HRVScore ?? 70),
    restingHeartRate: Number(input.restingHeartRateScore ?? 70), stress: 100 - Number(input.stressIndex ?? 30),
    trainingLoad: Number(input.trainingLoadScore ?? 70), muscleFatigue: 100 - Number(input.muscleFatigue ?? 30),
    bodyRecovery: Number(input.bodyRecovery ?? input.healthScore ?? 70),
    nutrition: Number(input.nutritionScore ?? input.nutrition?.score ?? 70),
  }
  const weights = { sleep: .2, hrv: .14, restingHeartRate: .09, stress: .13, trainingLoad: .12, muscleFatigue: .14, bodyRecovery: .09, nutrition: .09 }
  const score = Math.round(clamp(Object.entries(factors).reduce((sum, [key, value]) => sum + clamp(value) * weights[key], 0)))
  const contributors = Object.entries(factors).map(([factor, value]) => ({ factor, impact: value >= 75 ? 'positive' : value < 50 ? 'negative' : 'neutral', explanation: `${factor.replace(/([A-Z])/g, ' $1')} is ${value >= 75 ? 'supporting' : value < 50 ? 'limiting' : 'not materially changing'} recovery.` }))
  return immutable({ score, contributors, confidence: Math.round(clamp(45 + Object.values(factors).filter(Number.isFinite).length * 7)) })
}
