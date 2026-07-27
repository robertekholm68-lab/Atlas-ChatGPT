import { evaluateMuscleRecovery } from '../RecoveryEngine.js'
import { calculateFatigue } from './FatigueEngine.js'
import { createRecoverySnapshot, immutable } from './RecoveryModels.js'
import { calculateRecoveryScore } from './RecoveryScoreEngine.js'
import { calculateSleep } from './SleepEngine.js'
import { calculateStress } from './StressEngine.js'
import { calculateTrainingLoad } from './TrainingLoadEngine.js'
import { forecastReadiness } from './ReadinessForecastEngine.js'
import { generateRecoveryInsights } from './RecoveryInsightsEngine.js'

function enhanceMuscles(muscles, history = {}) {
  return Object.fromEntries(Object.entries(muscles).map(([id, muscle]) => {
    const previous = Number(history[id]?.recoveryPercentage)
    const velocity = Number.isFinite(previous) ? (muscle.recoveryPercentage - previous) / 24 : muscle.recoveryPercentage / Math.max(1, muscle.recommendedWait + 24)
    return [id, immutable({ ...muscle, trend: !Number.isFinite(previous) ? 'stable' : muscle.recoveryPercentage > previous + 2 ? 'improving' : muscle.recoveryPercentage < previous - 2 ? 'declining' : 'stable', estimatedHoursRemaining: muscle.recommendedWait, recoveryVelocity: Math.round(velocity * 100) / 100, recentlyOverloaded: muscle.recoveryPercentage < 40 || muscle.effectiveSets > 20, highlight: muscle.recoveryPercentage < 80 })]
  }))
}

export function buildRecoverySnapshot(input = {}) {
  const sleep = calculateSleep(input.sleep || {})
  const stress = calculateStress({ ...input, ...input.stress, sleepScore: sleep.score })
  const trainingLoad = calculateTrainingLoad(input.workoutHistory, input.timestamp)
  const muscleRecovery = enhanceMuscles(evaluateMuscleRecovery(input.muscles, input.timestamp), input.previousMuscleRecovery)
  const fatigue = calculateFatigue({ ...input, sleepScore: sleep.score, stressIndex: stress.index, muscleRecovery })
  const nutritionScore = input.nutrition?.score?.score ?? input.nutrition?.score
  const score = calculateRecoveryScore({ ...input, nutritionScore, sleepScore: sleep.score, stressIndex: stress.index, trainingLoadScore: trainingLoad.score, muscleFatigue: fatigue.overall })
  const forecast = forecastReadiness({ recoveryScore: score.score, muscleRecovery, sleepTrend: sleep.trend, stressTrend: stress.trend, loadStatus: trainingLoad.status })
  const recommendation = score.score >= 80 ? 'Heavy day approved' : score.score >= 60 ? forecast.today.recommendation : score.score >= 40 ? 'Reduce sets and intensity' : 'Recovery day: walking and mobility'
  const snapshot = createRecoverySnapshot({ ...input, recoveryScore: score.score, sleepScore: sleep.score, sleepDebt: sleep.sleepDebt, stress, fatigue, trainingLoad, muscleRecovery, readiness: score.score >= 75 ? 'ready' : score.score >= 50 ? 'limited' : 'recover', recommendation, confidence: score.confidence })
  return immutable({ snapshot, sleep, stress, trainingLoad, fatigue, nutrition: input.nutrition?.recoverySignals ?? null, score, forecast, insights: generateRecoveryInsights({ sleep, stress, trainingLoad, muscleRecovery, hrvTrend: input.hrvTrend }), notificationCandidates: createRecoveryNotificationCandidates(score.score, trainingLoad.status) })
}

export const createRecoveryIntelligence = buildRecoverySnapshot
const recoveryCache = new WeakMap()
export function selectRecoveryIntelligence(input = {}) {
  if (input && typeof input === 'object' && recoveryCache.has(input)) return recoveryCache.get(input)
  const result = buildRecoverySnapshot(input)
  if (input && typeof input === 'object') recoveryCache.set(input, result)
  return result
}
export function createRecoveryNotificationCandidates(score, loadStatus) {
  return immutable([score >= 85 ? { type: 'excellent_recovery', message: 'Excellent recovery today.' } : null, score < 45 ? { type: 'recovery_day', message: 'Take a recovery day.' } : null, loadStatus === 'overreaching' ? { type: 'recovery_dropping', message: 'Recovery dropping.' } : null, score >= 80 ? { type: 'pr_ready', message: 'You are ready for a PR attempt.' } : null].filter(Boolean))
}
