import assert from 'node:assert/strict'
import { test } from 'node:test'
import { generateAtlasPredictions, comparePredictionScenarios } from '../src/core/predictionEngine.js'

const now = new Date('2026-07-21T00:00:00Z').getTime()
const daysAgo = d => new Date(now - d * 86400000).toISOString()
const workout = d => ({ id: `w${d}`, completedAt: daysAgo(d), exercises: [{ id: 'squat', name: 'Squat', sets: [{ done: true, kg: 100 - d, reps: 5 }] }] })
const metricState = values => ({ profile: { measurements: values.map(([d, weight]) => ({ createdAt: daysAgo(d), weight })) }, workouts: [] })

test('returns structured insufficient data when requested', () => {
  const result = generateAtlasPredictions(metricState([[1, 80]]), now, { includeInsufficient: true })
  assert.equal(result.items.find(i => i.id === 'trend-weight').status, 'insufficient-data')
})

test('stable trend produces active projection', () => {
  const result = generateAtlasPredictions(metricState([[21, 80], [14, 80.1], [7, 80], [0, 80.1]]), now)
  const item = result.items.find(i => i.id === 'trend-weight')
  assert.equal(item.trend, 'stable')
  assert.equal(item.status, 'active')
})

test('improving trend is detected for rising metric', () => {
  const item = generateAtlasPredictions(metricState([[21, 80], [14, 81], [7, 82], [0, 83]]), now).items.find(i => i.id === 'trend-weight')
  assert.equal(item.trend, 'improving')
})

test('declining trend is detected for falling metric', () => {
  const item = generateAtlasPredictions(metricState([[21, 83], [14, 82], [7, 81], [0, 80]]), now).items.find(i => i.id === 'trend-weight')
  assert.equal(item.trend, 'declining')
})

test('plateau detection returns plateau risk with continued activity', () => {
  const result = generateAtlasPredictions({ workouts: [1,5,9,13,17,21,25,29].map(workout), memory: { exercises: [{ latestWeight: 100, bestWeight: 100 }] } }, now)
  assert.ok(result.items.some(i => i.type === 'plateau-risk'))
})

test('volatile data lowers confidence', () => {
  const stable = generateAtlasPredictions(metricState([[21, 80], [14, 80.2], [7, 80.4], [0, 80.6]]), now).items.find(i => i.id === 'trend-weight')
  const volatile = generateAtlasPredictions(metricState([[21, 80], [14, 84], [7, 79], [0, 83]]), now).items.find(i => i.id === 'trend-weight')
  assert.ok(volatile.confidence < stable.confidence)
})

test('goal-date estimation creates goal timeline', () => {
  const state = metricState([[21, 83], [14, 82], [7, 81], [0, 80]])
  state.goals = [{ id: 'g1', title: 'Weight goal', target: '78 kg' }]
  const item = generateAtlasPredictions(state, now).items.find(i => i.type === 'goal-timeline')
  assert.ok(item.targetDate)
})

test('scenario comparison applies weekly deltas', () => {
  const state = { workouts: [1, 3, 8, 15].map(workout) }
  const scenarios = comparePredictionScenarios(state, [{ id: 'plus', weeklyWorkoutDelta: 1 }], now)
  assert.ok(scenarios[0].projectedWorkouts28Days > 4)
})

test('prediction generation does not mutate input state', () => {
  const state = metricState([[21, 83], [14, 82], [7, 81], [0, 80]])
  const before = JSON.stringify(state)
  generateAtlasPredictions(state, now)
  assert.equal(JSON.stringify(state), before)
})

test('legacy state compatibility handles missing predictions', () => {
  const result = generateAtlasPredictions({ profile: {}, workouts: [] }, now)
  assert.deepEqual(Object.keys(result).sort(), ['generatedAt', 'items', 'scenarios'])
})
