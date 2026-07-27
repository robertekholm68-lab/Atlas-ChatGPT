import { average, clamp, immutable } from './RecoveryModels.js'

export function forecastReadiness(input = {}) {
  const current = clamp(input.recoveryScore ?? 0)
  const muscles = input.muscleRecovery || {}
  const improving = input.sleepTrend === 'improving' || input.stressTrend === 'decreasing'
  const loadPenalty = ['overreaching', 'potential_overtraining'].includes(input.loadStatus) ? 5 : 0
  const velocity = average(Object.values(muscles).map(item => Number(item.recoveryVelocity) || 1.2))
  const scoreAt = hours => Math.round(clamp(current + velocity * hours / 8 + (improving ? hours / 24 * 2 : 0) - loadPenalty))
  const avoid = Object.entries(muscles).filter(([, value]) => (value.recoveryPercentage ?? 100) < 50).map(([id]) => id)
  const best = Object.entries(muscles).filter(([, value]) => (value.recoveryPercentage ?? 0) >= 70).map(([id]) => id)
  const recommendation = avoid.some(id => ['quads', 'glutes', 'hamstrings', 'lower-back'].includes(id)) ? 'Upper body recommended' : best.length ? `${best[0]} session recommended` : 'Mobility and walking recommended'
  return immutable({ today: { hours: 0, score: Math.round(current), recommendation }, tomorrow: { hours: 24, score: scoreAt(24), recommendation }, in48Hours: { hours: 48, score: scoreAt(48), recommendation }, in72Hours: { hours: 72, score: scoreAt(72), recommendation }, trend: scoreAt(48) > current + 4 ? 'Recovery improving' : 'Recovery stable', avoid: avoid.map(id => `Avoid heavy loading for ${id}`) })
}
