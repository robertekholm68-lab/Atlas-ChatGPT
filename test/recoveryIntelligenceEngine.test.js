import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRecoverySnapshot, calculateSleep, calculateStress, calculateTrainingLoad, forecastReadiness, selectRecoveryIntelligence } from '../src/engines/recovery/index.js'
import { makeCoachDecision } from '../src/engines/CoachDecisionEngine.js'
import { recoveryScenarios } from './fixtures/recoveryScenarios.js'

test('builds immutable, explained recovery intelligence for all scenarios', () => {
  for (const scenario of Object.values(recoveryScenarios)) {
    const result = buildRecoverySnapshot(scenario)
    assert.ok(result.snapshot.recoveryScore >= 0 && result.snapshot.recoveryScore <= 100)
    assert.ok(result.score.contributors.every(item => item.explanation.length > 10))
    assert.ok(Object.isFrozen(result) && Object.isFrozen(result.snapshot))
  }
})

test('sleep and stress react in the expected direction', () => {
  assert.ok(calculateSleep(recoveryScenarios.excellentRecovery.sleep).score > calculateSleep(recoveryScenarios.poorSleep.sleep).score)
  assert.ok(calculateStress(recoveryScenarios.stressAtWork).index > calculateStress(recoveryScenarios.excellentRecovery).index)
})

test('rolling load detects a heavy week and forecast improves with time', () => {
  const load = calculateTrainingLoad(recoveryScenarios.heavyTrainingWeek.workoutHistory, recoveryScenarios.heavyTrainingWeek.timestamp)
  assert.ok(['overreaching', 'potential_overtraining'].includes(load.status))
  const forecast = forecastReadiness({ recoveryScore: 50, muscleRecovery: { quads: { recoveryPercentage: 30, recoveryVelocity: 2 } } })
  assert.ok(forecast.in72Hours.score > forecast.today.score)
  assert.match(forecast.today.recommendation, /Upper body/)
})

test('muscle recovery is enhanced and coach consumes recovery intelligence', () => {
  const intelligence = buildRecoverySnapshot({ ...recoveryScenarios.poorSleep, muscles: { quads: { effectiveSets: 20, timeSinceLastWorkout: 6 } } })
  assert.equal(intelligence.snapshot.muscleRecovery.quads.highlight, true)
  assert.ok(intelligence.snapshot.muscleRecovery.quads.estimatedHoursRemaining > 0)
  const decision = makeCoachDecision({ session: {}, recoveryIntelligence: intelligence, recovery: { muscles: intelligence.snapshot.muscleRecovery } })
  assert.notEqual(decision.decision, 'insufficient_data')
  assert.ok(decision.reasonCodes.some(code => code.startsWith('RECOVERY_INTELLIGENCE_')))
})

test('selector memoizes an unchanged input identity', () => {
  const input = recoveryScenarios.excellentRecovery
  assert.equal(selectRecoveryIntelligence(input), selectRecoveryIntelligence(input))
})
