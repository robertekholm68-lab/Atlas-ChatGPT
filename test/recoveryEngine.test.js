import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildRecoveryIntelligence,
  calculateMuscleRecovery,
  calculateOverallFatigue,
  evaluateMuscleRecovery,
  generateWorkoutRecommendation,
  getHoursSince,
} from '../src/engines/RecoveryEngine.js'

const now = new Date('2026-07-25T12:00:00.000Z')

test('empty history is fully recovered and produces a training recommendation', () => {
  const result = buildRecoveryIntelligence({}, now)
  assert.equal(result.overallReadiness, 100)
  assert.equal(result.overallFatigue, 0)
  assert.equal(result.muscles.chest.status, 'recovered')
  assert.equal(result.muscles.chest.recommendedWait, 0)
  assert.equal(result.workoutRecommendation.recommendation, 'Train Push')
  assert.equal(result.workoutRecommendation.confidence, 75)
})

test('single recent workout reports recovery progress and recommended wait', () => {
  const result = calculateMuscleRecovery({
    effectiveSets: 10,
    weeklyVolume: 5000,
    trainingFrequency: 1,
    fatigueMultiplier: 1.2,
    timeSinceLastWorkout: 20,
    thresholds: { mev: 8, mrv: 22 },
  })
  assert.equal(result.status, 'recovering')
  assert.ok(result.recoveryPercentage >= 40 && result.recoveryPercentage < 80)
  assert.ok(result.recommendedWait > 0)
})

test('high frequency and fatigue reduce recovery at the same elapsed time', () => {
  const baseline = calculateMuscleRecovery({ effectiveSets: 10, trainingFrequency: 1, fatigueMultiplier: 1, timeSinceLastWorkout: 24 })
  const highFrequency = calculateMuscleRecovery({ effectiveSets: 10, trainingFrequency: 5, fatigueMultiplier: 1.4, timeSinceLastWorkout: 24 })
  assert.ok(highFrequency.recoveryPercentage < baseline.recoveryPercentage)
  assert.ok(highFrequency.recommendedWait > baseline.recommendedWait)
})

test('MRV exceeded forces a deload recommendation', () => {
  const muscles = evaluateMuscleRecovery({
    chest: { weeklyEffectiveSets: 23, lastTrained: '2026-07-25T10:00:00.000Z' },
  }, now)
  const result = generateWorkoutRecommendation(muscles)
  assert.equal(result.recommendation, 'Deload')
  assert.ok(result.confidence >= 75)
})

test('not reaching MEV does not create artificial fatigue', () => {
  const belowMev = calculateMuscleRecovery({ effectiveSets: 2, trainingFrequency: 1, timeSinceLastWorkout: 24, thresholds: { mev: 8, mrv: 22 } })
  const productive = calculateMuscleRecovery({ effectiveSets: 10, trainingFrequency: 1, timeSinceLastWorkout: 24, thresholds: { mev: 8, mrv: 22 } })
  assert.ok(belowMev.recoveryPercentage > productive.recoveryPercentage)
})

test('decision engine chooses the split with the highest average readiness', () => {
  const recovery = Object.fromEntries([
    ['chest', 95], ['front-delts', 90], ['triceps', 92],
    ['lats', 55], ['upper-back', 50], ['biceps', 60],
    ['quads', 65], ['glutes', 60], ['hamstrings', 62], ['calves', 64],
  ].map(([id, recoveryPercentage]) => [id, { recoveryPercentage, effectiveSets: 5 }]))
  const result = generateWorkoutRecommendation(recovery)
  assert.equal(result.recommendation, 'Train Push')
  assert.equal(result.readiness, 92)
  assert.ok(result.confidence > 50)
})

test('low overall readiness recommends recovery rather than training', () => {
  const recovery = { chest: { recoveryPercentage: 30 }, lats: { recoveryPercentage: 40 } }
  assert.equal(generateWorkoutRecommendation(recovery).recommendation, 'Recovery Day')
})

test('overall fatigue is complementary to average readiness and ignores invalid entries', () => {
  assert.deepEqual(calculateOverallFatigue({ chest: { recoveryPercentage: 80 }, lats: { recoveryPercentage: 40 }, bad: {} }), {
    overallFatigue: 40,
    overallReadiness: 60,
  })
})

test('date calculation clamps future workouts and rejects invalid dates', () => {
  assert.equal(getHoursSince('2026-07-24T12:00:00.000Z', now), 24)
  assert.equal(getHoursSince('2026-07-26T12:00:00.000Z', now), 0)
  assert.equal(getHoursSince('invalid', now), null)
})

test('recovery functions do not mutate their inputs', () => {
  const muscles = { chest: { weeklyEffectiveSets: 10, frequency: 2, lastTrained: '2026-07-24T12:00:00.000Z' } }
  const snapshot = JSON.stringify(muscles)
  buildRecoveryIntelligence(muscles, now)
  assert.equal(JSON.stringify(muscles), snapshot)
})
