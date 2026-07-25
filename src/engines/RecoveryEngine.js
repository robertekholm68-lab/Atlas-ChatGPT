import { muscleThresholds } from './muscleThresholds.js'

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000

export const workoutMuscleGroups = Object.freeze({
  'Train Push': Object.freeze(['chest', 'front-delts', 'triceps']),
  'Train Pull': Object.freeze(['lats', 'upper-back', 'biceps']),
  'Train Legs': Object.freeze(['quads', 'glutes', 'hamstrings', 'calves']),
  'Upper Body': Object.freeze(['chest', 'front-delts', 'triceps', 'lats', 'upper-back', 'biceps']),
  'Lower Body': Object.freeze(['quads', 'glutes', 'hamstrings', 'calves']),
})

function finiteNonNegative(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, number) : fallback
}

function clamp(value, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value))
}

function round(value) {
  return Math.round(value)
}

export function getHoursSince(lastWorkout, now = new Date()) {
  if (lastWorkout == null) return null
  const completedAt = new Date(lastWorkout).getTime()
  const currentTime = new Date(now).getTime()
  if (!Number.isFinite(completedAt) || !Number.isFinite(currentTime)) return null
  return Math.max(0, (currentTime - completedAt) / HOUR_IN_MILLISECONDS)
}

/**
 * Calculates recovery for one muscle. Load increases the recovery window while
 * elapsed time restores readiness. Passing no training history returns recovered.
 */
export function calculateMuscleRecovery(input = {}) {
  const effectiveSets = finiteNonNegative(input.effectiveSets ?? input.weeklyEffectiveSets)
  const weeklyVolume = finiteNonNegative(input.weeklyVolume)
  const trainingFrequency = finiteNonNegative(input.trainingFrequency ?? input.frequency)
  const fatigueMultiplier = finiteNonNegative(input.fatigueMultiplier, 1) || 1
  const timeSinceLastWorkout = input.timeSinceLastWorkout == null
    ? null
    : finiteNonNegative(input.timeSinceLastWorkout)
  const thresholds = input.thresholds ?? {}
  const mev = finiteNonNegative(thresholds.mev, 0)
  const mrv = Math.max(1, finiteNonNegative(thresholds.mrv, 20))

  if (timeSinceLastWorkout == null && effectiveSets === 0 && weeklyVolume === 0 && trainingFrequency === 0) {
    return { recoveryPercentage: 100, status: 'recovered', recommendedWait: 0 }
  }

  const setLoad = effectiveSets / mrv
  const frequencyLoad = Math.max(0, trainingFrequency - 1) * 0.12
  // Tonnage is scaled rather than compared directly with set thresholds.
  const volumeLoad = Math.min(0.35, weeklyVolume / 50000)
  const belowMevRelief = mev > 0 && effectiveSets < mev ? 0.1 : 0
  const recoveryWindow = 24 * Math.max(0.75, 1 + setLoad + frequencyLoad + volumeLoad - belowMevRelief) * fatigueMultiplier
  const elapsedHours = timeSinceLastWorkout ?? 0
  const recoveryPercentage = round(clamp((elapsedHours / recoveryWindow) * 100))
  const recommendedWait = Math.max(0, Math.ceil(recoveryWindow - elapsedHours))
  const status = recoveryPercentage >= 80
    ? 'recovered'
    : recoveryPercentage >= 40
      ? 'recovering'
      : 'fatigued'

  return { recoveryPercentage, status, recommendedWait }
}

export function calculateOverallFatigue(muscleRecovery = {}) {
  const values = Object.values(muscleRecovery)
    .map((muscle) => Number(muscle?.recoveryPercentage))
    .filter(Number.isFinite)
  const overallReadiness = values.length === 0
    ? 100
    : round(values.reduce((total, value) => total + clamp(value), 0) / values.length)

  return { overallFatigue: 100 - overallReadiness, overallReadiness }
}

export function evaluateMuscleRecovery(muscles = {}, now = new Date(), thresholds = muscleThresholds) {
  return Object.fromEntries(Object.keys(thresholds).map((muscleId) => {
    const muscle = muscles[muscleId] ?? {}
    const timeSinceLastWorkout = muscle.timeSinceLastWorkout
      ?? getHoursSince(muscle.lastTrained, now)
    return [muscleId, {
      ...calculateMuscleRecovery({
        ...muscle,
        effectiveSets: muscle.effectiveSets ?? muscle.weeklyEffectiveSets,
        timeSinceLastWorkout,
        thresholds: thresholds[muscleId],
      }),
      effectiveSets: finiteNonNegative(muscle.effectiveSets ?? muscle.weeklyEffectiveSets),
      weeklyVolume: finiteNonNegative(muscle.weeklyVolume),
      trainingFrequency: finiteNonNegative(muscle.trainingFrequency ?? muscle.frequency),
    }]
  }))
}

function averageReadiness(muscleRecovery, muscleIds) {
  const scores = muscleIds.map((id) => muscleRecovery[id]?.recoveryPercentage ?? 100)
  return round(scores.reduce((total, score) => total + score, 0) / scores.length)
}

export function generateWorkoutRecommendation(muscleRecovery = {}, thresholds = muscleThresholds) {
  const { overallFatigue, overallReadiness } = calculateOverallFatigue(muscleRecovery)
  const exceededMrv = Object.entries(muscleRecovery).some(([muscleId, muscle]) => (
    (muscle.effectiveSets ?? 0) > (thresholds[muscleId]?.mrv ?? Infinity)
  ))

  if (exceededMrv || overallFatigue >= 75) {
    return { recommendation: 'Deload', confidence: Math.max(75, overallFatigue), overallFatigue, overallReadiness }
  }
  if (overallReadiness < 45) {
    return { recommendation: 'Recovery Day', confidence: 100 - overallReadiness, overallFatigue, overallReadiness }
  }

  const candidates = Object.entries(workoutMuscleGroups).map(([recommendation, muscleIds]) => ({
    recommendation,
    readiness: averageReadiness(muscleRecovery, muscleIds),
  })).sort((left, right) => right.readiness - left.readiness)
  const best = candidates[0]
  const runnerUp = candidates[1]
  const confidence = round(clamp(50 + (best.readiness - runnerUp.readiness) + (best.readiness - 50) / 2))

  return {
    recommendation: best.recommendation,
    confidence,
    readiness: best.readiness,
    overallFatigue,
    overallReadiness,
  }
}

export function buildRecoveryIntelligence(muscles = {}, now = new Date(), thresholds = muscleThresholds) {
  const muscleRecovery = evaluateMuscleRecovery(muscles, now, thresholds)
  return {
    muscles: muscleRecovery,
    ...calculateOverallFatigue(muscleRecovery),
    workoutRecommendation: generateWorkoutRecommendation(muscleRecovery, thresholds),
  }
}
