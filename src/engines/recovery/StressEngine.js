import { average, clamp, immutable } from './RecoveryModels.js'

export function calculateStress(input = {}) {
  const baselineRhr = Number(input.baselineRestingHeartRate) || Number(input.restingHeartRate) || 60
  const baselineHrv = Number(input.baselineHRV) || Number(input.HRV ?? input.hrv) || 50
  const rhr = Number(input.restingHeartRate) || baselineRhr
  const hrv = Number(input.HRV ?? input.hrv) || baselineHrv
  const manual = clamp((Number(input.manualStress) || 0) * (Number(input.manualStress) <= 10 ? 10 : 1))
  const physiological = clamp(50 + (rhr - baselineRhr) * 5 + (baselineHrv - hrv) * 1.5)
  const poorSleep = 100 - clamp(input.sleepScore ?? 100)
  const index = Math.round(clamp(physiological * .4 + manual * .35 + poorSleep * .25))
  const history = (input.history || []).map(Number).filter(Number.isFinite)
  const prior = average(history.slice(-4))
  return immutable({ index, physiological: Math.round(physiological), manual: Math.round(manual), trend: history.length ? index > prior + 5 ? 'increasing' : index < prior - 5 ? 'decreasing' : 'stable' : 'stable', level: index >= 75 ? 'high' : index >= 45 ? 'moderate' : 'low' })
}
