import test from 'node:test'
import assert from 'node:assert/strict'
import {
  WORKOUT_MODE,
  activeModeState,
  addWorkoutExercise,
  addWorkoutSet,
  completeWorkoutSet,
  copyPreviousSet,
  extendWorkoutRest,
  normalizeWorkoutSession,
  parseWorkoutState,
  pauseWorkoutRest,
  removeWorkoutExercise,
  removeWorkoutSet,
  replaceWorkoutExercise,
  resumeWorkoutRest,
  saveCompletedWorkout,
  serializeWorkoutState,
  skipWorkoutRest,
  startWorkout,
  updateWorkoutSet,
  workoutSummary
} from '../src/workoutSessionModel.js'

const NOW = Date.parse('2026-07-25T10:00:00.000Z')
const library = [
  { id: 'bench', name: 'Bänkpress', sets: '2 × 8', restDurationSeconds: 120, exerciseDna: { movementPattern: 'horizontal-push' }, activationWeights: { primary: { chest: 1 }, secondary: { triceps: 0.5 } }, primaryMuscles: ['chest'], secondaryMuscles: ['triceps'] },
  { id: 'row', name: 'Sittande rodd', targetSets: 3, restDurationSeconds: 90, exerciseDna: { movementPattern: 'horizontal-pull' }, activationWeights: { primary: { 'upper-back': 1 }, secondary: { biceps: 0.5 } }, primaryMuscles: ['upper-back'], secondaryMuscles: ['biceps'] }
]

test('starts normalized real and demo sessions without mixing modes', () => {
  const program = { id: 'upper', name: 'Överkropp', exercises: ['bench'] }
  const real = startWorkout(program, library, { now: NOW, mode: 'real', previousValues: { bench: { kg: 80, reps: 6 } } })
  const demo = startWorkout(program, library, { now: NOW + 1, mode: 'demo' })
  assert.equal(real.mode, WORKOUT_MODE.REAL)
  assert.equal(demo.mode, WORKOUT_MODE.DEMO)
  assert.deepEqual(real.exercises[0].sets.map(set => [set.kg, set.reps]), [[80, 6], [80, 6]])
  assert.equal(real.exercises[0].exerciseDna.movementPattern, 'horizontal-push')
})

test('normalization restores a timestamp timer and safely rejects invalid sessions', () => {
  assert.equal(normalizeWorkoutSession(null, NOW), null)
  const restored = normalizeWorkoutSession({ id: 4, startedAt: NOW - 1000, exercises: [], restTimer: { durationSeconds: 90, endsAt: NOW + 30_000, status: 'running' } }, NOW)
  assert.equal(restored.id, '4')
  assert.equal(restored.restTimer.endsAt, NOW + 30_000)
  assert.equal(restored.restTimer.status, 'running')
})

test('updates, copies, adds and removes sets immutably', () => {
  const original = startWorkout({ name: 'Test', exercises: ['bench'] }, library, { now: NOW })
  const edited = updateWorkoutSet(original, 0, 0, { kg: 82.5, reps: 7 })
  const copied = copyPreviousSet(edited, 0, 1)
  const added = addWorkoutSet(copied, 0, NOW + 1)
  const removed = removeWorkoutSet(added, 0, 1)
  assert.equal(original.exercises[0].sets[0].kg, 0)
  assert.deepEqual([copied.exercises[0].sets[1].kg, copied.exercises[0].sets[1].reps], [82.5, 7])
  assert.equal(added.exercises[0].sets.length, 3)
  assert.equal(removed.exercises[0].sets.length, 2)
})

test('one-tap completion starts the exercise timestamp rest timer', () => {
  const session = startWorkout({ name: 'Test', exercises: ['bench'] }, library, { now: NOW })
  const completed = completeWorkoutSet(session, 0, 0, NOW, true)
  assert.equal(completed.exercises[0].sets[0].done, true)
  assert.equal(completed.restTimer.status, 'running')
  assert.equal(completed.restTimer.endsAt, NOW + 120_000)
  const undone = completeWorkoutSet(completed, 0, 0, NOW + 1, true)
  assert.equal(undone.exercises[0].sets[0].done, false)
  assert.equal(undone.restTimer.endsAt, completed.restTimer.endsAt)
})

test('rest controls delegate to the timestamp timer engine', () => {
  let session = completeWorkoutSet(startWorkout({ exercises: ['bench'] }, library, { now: NOW }), 0, 0, NOW)
  session = pauseWorkoutRest(session, NOW + 20_000)
  assert.deepEqual([session.restTimer.status, session.restTimer.remainingSeconds], ['paused', 100])
  session = extendWorkoutRest(session, 30, NOW + 20_000)
  assert.equal(session.restTimer.remainingSeconds, 130)
  session = resumeWorkoutRest(session, NOW + 30_000)
  assert.equal(session.restTimer.endsAt, NOW + 160_000)
  session = skipWorkoutRest(session, NOW + 31_000)
  assert.equal(session.restTimer.status, 'completed')
})

test('adds, replaces and removes exercises while preserving intelligence metadata', () => {
  const session = startWorkout({ exercises: ['bench'] }, library, { now: NOW })
  const added = addWorkoutExercise(session, library[1], NOW)
  assert.equal(added.exercises[1].activationWeights.primary['upper-back'], 1)
  const replaced = replaceWorkoutExercise(added, 0, library[1], NOW)
  assert.deepEqual(replaced.exercises[0].primaryMuscles, ['upper-back'])
  assert.equal(removeWorkoutExercise(replaced, 1).exercises.length, 1)
  assert.equal(addWorkoutExercise(added, library[1], NOW), added)
})

test('completed summaries are duplicate-safe', () => {
  let session = startWorkout({ id: 'upper', name: 'Överkropp', exercises: ['bench'] }, library, { now: NOW })
  session = updateWorkoutSet(session, 0, 0, { kg: 80, reps: 8 })
  session = completeWorkoutSet(session, 0, 0, NOW + 1)
  const completed = workoutSummary(session, NOW + 60_000)
  assert.deepEqual({ sets: completed.sets, volume: completed.volume, duration: completed.duration }, { sets: 1, volume: 640, duration: 1 })
  assert.equal(saveCompletedWorkout(saveCompletedWorkout([], completed), completed).length, 1)
})

test('persistence parsing is safe and isolates real and demo data', () => {
  const state = parseWorkoutState({ mode: 'demo', real: { history: [{ id: 'real' }] }, demo: { history: [{ id: 'demo' }] } }, NOW)
  assert.equal(activeModeState(state).history[0].id, 'demo')
  assert.equal(parseWorkoutState('{bad json').mode, 'real')
  const roundTrip = parseWorkoutState(serializeWorkoutState(state), NOW)
  assert.deepEqual(roundTrip.real.history, [{ id: 'real' }])
  assert.deepEqual(roundTrip.demo.history, [{ id: 'demo' }])
})
