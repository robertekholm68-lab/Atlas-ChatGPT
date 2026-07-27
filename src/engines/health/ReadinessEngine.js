import { deepFreeze } from './HealthModels.js'

const clamp = value => Math.min(100, Math.max(0, Number(value)))
const workoutLoad = (history, now) => (Array.isArray(history) ? history : []).filter(item => new Date(item.completedAt || item.date) > new Date(now).getTime() - 7 * 86_400_000).length

export function calculateReadiness(input = {}) {
  const healthScore = Number(input.healthScore?.score ?? input.healthScore)
  const recovery = Number(input.recovery?.overallReadiness ?? input.recovery)
  const snapshot = input.snapshot || {}
  const signals = [
    ['health', healthScore, 0.3], ['recovery', recovery, 0.25],
    ['sleep', snapshot.sleepScore ?? (snapshot.sleepDuration == null ? NaN : clamp((snapshot.sleepDuration / 8) * 100)), 0.2],
    ['stress', snapshot.stressScore == null ? NaN : 100 - clamp(snapshot.stressScore), 0.1],
    ['hrv', snapshot.heartRateVariability == null ? NaN : clamp((snapshot.heartRateVariability / 80) * 100), 0.15],
  ].filter(([, value]) => Number.isFinite(value))
  const totalWeight = signals.reduce((sum, [, , weight]) => sum + weight, 0)
  let score = totalWeight ? signals.reduce((sum, [, value, weight]) => sum + clamp(value) * weight, 0) / totalWeight : 0
  const recentSessions = workoutLoad(input.workoutHistory, input.now ?? snapshot.timestamp ?? new Date())
  if (recentSessions >= 6) score -= 8
  score = Math.round(clamp(score))
  const status = score >= 85 ? 'Ready' : score >= 70 ? 'Good' : score >= 50 ? 'Moderate' : 'Recover'
  const limiting = [...signals].sort((left, right) => left[1] - right[1])[0]?.[0] ?? null
  return deepFreeze({ score, status, explanation: { summary: status === 'Ready' ? 'Fully ready for demanding training.' : status === 'Good' ? 'Ready for normal training.' : status === 'Moderate' ? 'Consider reduced volume or intensity.' : 'Prioritize recovery, walking, or mobility.', limiting, recentSessions }, coverage: Math.round(totalWeight * 100) })
}
