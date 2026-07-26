const GROUPS = Object.freeze({
  push: ['chest', 'front-delts', 'triceps'], pull: ['lats', 'upper-back', 'biceps'],
  legs: ['quads', 'glutes', 'hamstrings', 'calves'], upper: ['chest', 'front-delts', 'triceps', 'lats', 'upper-back', 'biceps'],
  lower: ['quads', 'glutes', 'hamstrings', 'calves'], full_body: ['chest', 'lats', 'quads', 'glutes'],
})

const clamp = value => Math.min(100, Math.max(0, Math.round(value)))
const readinessOf = muscle => Number(muscle?.recoveryPercentage ?? muscle?.readiness)
const latestType = history => [...history].sort((a, b) => new Date(b.completedAt || b.date || 0) - new Date(a.completedAt || a.date || 0))[0]?.recommendation

export function makeCoachDecision(input = {}) {
  const history = Array.isArray(input.workoutHistory) ? input.workoutHistory : []
  const recovery = input.recovery?.muscles || input.recovery || {}
  const goal = input.goalProfile || {}
  const entries = Object.entries(recovery).filter(([, value]) => Number.isFinite(readinessOf(value)))
  if (!input.session && !history.length && !entries.length) return {
    decision: 'insufficient_data', recommendation: 'recovery', confidence: 0, focusMuscles: [], avoidMuscles: [], estimatedDuration: goal.availableTime || 30,
    sessionIntensity: 'low', reasonCodes: ['INSUFFICIENT_TRAINING_DATA'], alternativeRecommendations: [],
  }

  const avoidMuscles = entries.filter(([, value]) => readinessOf(value) < 45 || value.status === 'fatigued').map(([id]) => id)
  const readyMuscles = entries.filter(([, value]) => readinessOf(value) >= 70).sort((a, b) => readinessOf(b[1]) - readinessOf(a[1])).map(([id]) => id)
  const suppliedOverall = Number(input.recovery?.overallReadiness)
  const overall = Number.isFinite(suppliedOverall) ? suppliedOverall : entries.length ? entries.reduce((sum, [, value]) => sum + readinessOf(value), 0) / entries.length : null
  const overMrv = Object.values(input.muscleIntelligence || {}).some(muscle => muscle.trainingZone === 'above-mrv' || muscle.uiStatus === 'recovery_warning')
  let decision = overMrv ? 'deload' : overall !== null && overall < 40 ? 'recovery' : overall !== null && overall < 65 ? 'train_light' : 'train'
  let recommendation = decision === 'recovery' ? 'recovery' : 'full_body'
  const preferred = goal.preferredSplit
  const candidates = Object.entries(GROUPS).map(([type, muscles]) => ({ type, score: muscles.reduce((sum, id) => sum + (Number.isFinite(readinessOf(recovery[id])) ? readinessOf(recovery[id]) : 65) + (goal.priorityMultipliers?.[id] ? 8 : 0) - (avoidMuscles.includes(id) ? 100 : 0), 0) / muscles.length }))
    .filter(candidate => candidate.type !== latestType(history))
    .sort((a, b) => b.score - a.score)
  if (!['recovery', 'deload'].includes(decision)) recommendation = candidates.find(candidate => candidate.type === preferred)?.type || candidates[0]?.type || 'full_body'
  if (decision === 'deload') recommendation = candidates[0]?.type || 'full_body'
  const focusMuscles = (recommendation === 'priority_muscles' ? goal.priorityMuscles : GROUPS[recommendation] || readyMuscles).filter(id => !avoidMuscles.includes(id)).slice(0, 4)
  const confidence = clamp(45 + entries.length * 5 + (overall === null ? 0 : Math.abs(overall - 55) / 2))
  const reasonCodes = [overMrv ? 'VOLUME_ABOVE_MRV' : null, overall === null ? 'WORKOUT_HISTORY_ROTATION' : overall < 40 ? 'LOW_OVERALL_READINESS' : overall < 65 ? 'MODERATE_READINESS' : 'HIGH_READINESS', avoidMuscles.length ? 'LOCAL_RECOVERY_RESTRICTION' : null, goal.priorityMuscles?.some(id => focusMuscles.includes(id)) ? 'GOAL_PRIORITY_MATCH' : null].filter(Boolean)
  return { decision, recommendation, confidence, focusMuscles, avoidMuscles, estimatedDuration: Math.min(goal.availableTime || 45, decision === 'train_light' || decision === 'deload' ? 35 : 60), sessionIntensity: decision === 'train' ? goal.intensityTarget?.level || 'moderate' : 'low', reasonCodes, alternativeRecommendations: candidates.filter(item => item.type !== recommendation).slice(0, 2).map(item => item.type) }
}

export const decideCoachRecommendation = makeCoachDecision
