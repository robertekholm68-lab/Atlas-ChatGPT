import test from 'node:test'
import assert from 'node:assert/strict'
import {
  HEALTH_SOURCES, HealthSourceProvider, HealthStorage, buildHealthIntelligence,
  calculateHealthScore, calculateHealthTrends, calculateReadiness,
  createAppleHealthProvider, createHealthSnapshot, createManualEntryProvider,
} from '../src/engines/health/index.js'
import { makeCoachDecision } from '../src/engines/CoachDecisionEngine.js'
import { calculateProgress } from '../src/engines/ProgressEngine.js'
import { buildBodyDashboardModel } from '../src/bodyIntelligenceModel.js'
import { healthFixtures } from './fixtures/healthFixtures.js'

test('HealthSnapshot normalizes data and is deeply immutable', () => {
  const snapshot = createHealthSnapshot({ timestamp: '2026-07-27', sleepScore: '82', source: HEALTH_SOURCES.FITBIT })
  assert.equal(snapshot.timestamp, '2026-07-27T00:00:00.000Z')
  assert.equal(snapshot.sleepScore, 82)
  assert.equal(snapshot.heartRateVariability, null)
  assert.equal(Object.isFrozen(snapshot), true)
  assert.throws(() => createHealthSnapshot({ timestamp: 'invalid' }), TypeError)
})

test('all providers share one validated asynchronous interface', async () => {
  const apple = createAppleHealthProvider(async () => [{ timestamp: '2026-07-27', sleepScore: 90, source: 'ignored' }])
  const manual = createManualEntryProvider([{ timestamp: '2026-07-26', steps: 3000 }])
  for (const [provider, source] of [[apple, HEALTH_SOURCES.APPLE_HEALTH], [manual, HEALTH_SOURCES.MANUAL]]) {
    assert.equal(provider instanceof HealthSourceProvider, true)
    const [snapshot] = await provider.getSnapshots()
    assert.equal(snapshot.source, source)
    assert.equal(Object.isFrozen(snapshot), true)
  }
  await assert.rejects(() => new HealthSourceProvider(HEALTH_SOURCES.GARMIN, async () => ({})).getSnapshots(), TypeError)
})

test('HealthStorage is append-only, deduplicated, chronological, and supports indexed lookups', () => {
  const store = new HealthStorage()
  assert.equal(store.append({ timestamp: '2026-07-27', source: HEALTH_SOURCES.OURA, externalId: 'reading-1' }), true)
  assert.equal(store.append({ timestamp: '2026-07-28', source: HEALTH_SOURCES.OURA, externalId: 'reading-1' }), false)
  store.append({ timestamp: '2026-07-26', source: HEALTH_SOURCES.MANUAL })
  assert.equal(store.size, 2)
  assert.equal(store.latest().timestamp, '2026-07-27T00:00:00.000Z')
  assert.equal(store.getByTimestamp('2026-07-26')?.source, HEALTH_SOURCES.MANUAL)
  assert.equal(store.between('2026-07-25', '2026-07-26T23:59:59Z').length, 1)
})

test('HealthScoreEngine returns a weighted 0-100 score with component explanation', () => {
  const healthy = calculateHealthScore(healthFixtures.healthyAthlete)
  const illness = calculateHealthScore(healthFixtures.illness)
  assert.ok(healthy.score >= 70 && healthy.score <= 100)
  assert.ok(illness.score < healthy.score)
  assert.ok(healthy.coverage > 0)
  assert.equal(typeof healthy.explanation.summary, 'string')
  assert.equal(calculateHealthScore({}).score, 0)
})

test('HealthTrendEngine calculates improving 7-day and 30-day structured trends', () => {
  const valid = Array.from({ length: 60 }, (_, index) => createHealthSnapshot({ timestamp: new Date(Date.UTC(2026, 4, 30 + index)).toISOString(), heartRateVariability: 40 + index, restingHeartRate: 75 - index / 2 }))
  const trends = calculateHealthTrends(valid, { now: valid.at(-1).timestamp, metrics: ['heartRateVariability', 'restingHeartRate'] })
  assert.equal(trends.periods['7Day'].heartRateVariability.direction, 'improving')
  assert.equal(trends.periods['7Day'].restingHeartRate.direction, 'improving')
  assert.equal(trends.periods['30Day'].heartRateVariability.sufficientData, true)
  assert.equal(trends.overall, 'improving')
})

test('ReadinessEngine maps physiology to all readiness bands with explanations', () => {
  const ready = calculateReadiness({ healthScore: 95, recovery: 95, snapshot: healthFixtures.excellentRecovery })
  const good = calculateReadiness({ healthScore: 75, recovery: 78, snapshot: { sleepScore: 75, stressScore: 25, heartRateVariability: 65 } })
  const moderate = calculateReadiness({ healthScore: 55, recovery: 55, snapshot: { sleepScore: 55, stressScore: 45, heartRateVariability: 40 } })
  const recover = calculateReadiness({ healthScore: 25, recovery: 25, snapshot: healthFixtures.illness })
  assert.deepEqual([ready.status, good.status, moderate.status, recover.status], ['Ready', 'Good', 'Moderate', 'Recover'])
  assert.equal(recover.explanation.limiting != null, true)
})

test('HealthEngine composes and memoizes immutable health intelligence', () => {
  const snapshots = [healthFixtures.healthyAthlete]
  const context = { recovery: { overallReadiness: 82 }, now: healthFixtures.healthyAthlete.timestamp }
  const first = buildHealthIntelligence(snapshots, context)
  assert.equal(Object.isFrozen(first), true)
  assert.equal(first.latest, snapshots[0])
  assert.ok(first.healthScore.score > 0)
})

test('Coach, Body, and Progress engines consume health without changing workout inputs', () => {
  const healthIntelligence = buildHealthIntelligence([healthFixtures.highStress], { recovery: { overallReadiness: 75 }, now: healthFixtures.highStress.timestamp })
  const history = [{ id: 'one', completedAt: '2026-07-25', exercises: [] }]
  const before = JSON.stringify(history)
  const coach = makeCoachDecision({ workoutHistory: history, healthIntelligence, recovery: { overallReadiness: 80, muscles: { chest: { recoveryPercentage: 80 } } } })
  assert.equal(coach.decision, 'recovery')
  assert.ok(['walking', 'mobility'].includes(coach.healthAction))
  assert.ok(coach.reasonCodes.includes('PHYSIOLOGICAL_RECOVERY_NEEDED'))
  const body = buildBodyDashboardModel({ workouts: history, healthIntelligence })
  assert.equal(body.health.readiness.status, healthIntelligence.readiness.status)
  const progress = calculateProgress([], null, [], {}, { healthSnapshots: [healthFixtures.healthyAthlete, createHealthSnapshot({ ...healthFixtures.healthyAthlete, timestamp: '2026-07-28', bodyWeight: 70 })], healthIntelligence, now: '2026-07-28' })
  assert.equal(progress.health.weight.direction, 'declining')
  assert.equal(progress.health.healthScore, healthIntelligence.healthScore)
  assert.equal(JSON.stringify(history), before)
})
