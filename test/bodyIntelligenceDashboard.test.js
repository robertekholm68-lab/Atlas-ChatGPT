import test from 'node:test'
import assert from 'node:assert/strict'
import { buildBodyDashboardModel, getBodyHighlightState, sortVolumeSummary } from '../src/bodyIntelligenceModel.js'
import { exerciseLibrary } from '../src/workoutData.js'

const now = new Date('2026-07-26T12:00:00Z')
const workout = {
  id: 'workout-1', completedAt: '2026-07-25T12:00:00Z', recommendation: 'push',
  exercises: [{ exerciseId: 'bench-press', sets: [{ done: true, weight: 80, reps: 8, rpe: 8 }, { done: true, weight: 80, reps: 8, rpe: 9 }] }],
}

test('body selectors expose every MuscleIntelligence group and empty history safely', () => {
  const model = buildBodyDashboardModel({ exerciseLibrary, now })
  assert.equal(model.muscles.length, 10)
  assert.equal(model.hasHistory, false)
  assert.ok(model.muscles.every(muscle => muscle.recoveryPercentage === 100))
})

test('recovery and volume summaries are derived from engine output', () => {
  const model = buildBodyDashboardModel({ workouts: [workout], exerciseLibrary, now })
  const chest = model.muscles.find(muscle => muscle.id === 'chest')
  assert.equal(model.hasHistory, true)
  assert.ok(chest.effectiveSets > 0)
  assert.ok(Number.isFinite(model.recovery.fatigueScore))
  assert.equal(model.volume.highest[0].id, 'chest')
})

test('a completed live set updates body output before workout completion', () => {
  const before = buildBodyDashboardModel({ exerciseLibrary, now })
  const liveSession = { id: 'live', exercises: [{ exerciseId: 'bench-press', sets: [{ done: true, weight: 90, reps: 8, rpe: 9 }, { done: false, weight: 90, reps: 8, rpe: 9 }] }] }
  const after = buildBodyDashboardModel({ liveSession, exerciseLibrary, now })
  assert.ok(after.muscles.find(muscle => muscle.id === 'chest').effectiveSets > before.muscles.find(muscle => muscle.id === 'chest').effectiveSets)
})

test('highlight logic prioritizes selection and coach focus', () => {
  assert.equal(getBodyHighlightState('chest', 'chest', ['chest']), 'selected')
  assert.equal(getBodyHighlightState('chest', null, ['chest']), 'recommended')
  assert.equal(getBodyHighlightState('lats', null, ['chest']), 'none')
})

test('volume summaries sort highest, lowest, and alphabetically without mutation', () => {
  const input = [{ name: 'Rygg', effectiveSets: 4 }, { name: 'Bröst', effectiveSets: 8 }]
  assert.equal(sortVolumeSummary(input, 'highest')[0].name, 'Bröst')
  assert.equal(sortVolumeSummary(input, 'lowest')[0].name, 'Rygg')
  assert.equal(sortVolumeSummary(input, 'alphabetical')[0].name, 'Bröst')
  assert.equal(input[0].name, 'Rygg')
})

test('coach integration identifies focus and produces a body-linked message', () => {
  const model = buildBodyDashboardModel({ workouts: [workout], exerciseLibrary, now, goal: { priorityMuscles: ['lats'] } })
  assert.ok(model.focus.length > 0)
  assert.ok(model.coach.message.length > 0)
  assert.ok(Array.isArray(model.focusMuscles))
})
