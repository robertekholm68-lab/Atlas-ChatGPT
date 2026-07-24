import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateWorkoutSummary, completeSet, createWorkoutSession, modeKeys, saveCompletedWorkout, safeNumber } from '../src/workoutSessionModel.js'

const now = '2026-07-24T10:00:00.000Z'

test('starting a workout creates a planned real session that can become active', () => {
  const workout = createWorkoutSession({ mode: 'real', now })
  const started = { ...workout, status: 'active', startedAt: now }
  assert.equal(started.status, 'active')
  assert.equal(started.mode, 'real')
  assert.ok(started.exercises.length > 0)
})

test('logging and completing sets starts rest timer', () => {
  const workout = createWorkoutSession({ mode: 'real', now })
  const updated = completeSet(workout, 0, 0, { weight: '100', reps: '5', rpe: '8' }, now)
  assert.equal(updated.exercises[0].sets[0].completed, true)
  assert.equal(updated.restTimer.running, true)
  assert.equal(updated.restTimer.secondsRemaining, updated.exercises[0].restDuration)
})

test('restoring an interrupted workout preserves active state shape', () => {
  const workout = completeSet(createWorkoutSession({ mode: 'real', now }), 0, 0, { weight: 80, reps: 8 }, now)
  const restored = JSON.parse(JSON.stringify(workout))
  assert.equal(restored.status, 'active')
  assert.equal(restored.exercises[0].sets[0].weight, 80)
})

test('saving a completed workout stores history', () => {
  const workout = createWorkoutSession({ mode: 'real', now })
  const { completed, history } = saveCompletedWorkout(workout, [], now)
  assert.equal(completed.status, 'completed')
  assert.equal(history.length, 1)
})

test('saving twice avoids duplicate sessions', () => {
  const workout = createWorkoutSession({ mode: 'real', now })
  const first = saveCompletedWorkout(workout, [], now)
  const second = saveCompletedWorkout(workout, first.history, now)
  assert.equal(second.history.length, 1)
})

test('calculating total volume is safe for empty and invalid values', () => {
  assert.equal(safeNumber('bad'), 0)
  const workout = createWorkoutSession({ mode: 'real', now })
  const logged = completeSet(workout, 0, 0, { weight: 'bad', reps: undefined }, now)
  const summary = calculateWorkoutSummary(logged)
  assert.equal(summary.totalVolume, 0)
  assert.doesNotMatch(JSON.stringify(summary), /undefined|null|NaN/)
})

test('Demo Mode and Real Mode storage keys are isolated', () => {
  assert.notEqual(modeKeys('demo').active, modeKeys('real').active)
  assert.notEqual(modeKeys('demo').history, modeKeys('real').history)
})
