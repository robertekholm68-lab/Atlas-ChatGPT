import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMuscleHistory, buildWorkoutCompletionFeedback, detectProgression } from '../src/engines/MuscleHistoryEngine.js'

const library = [
  { id: 'press', name: 'Incline Press', equipment: 'Barbell', primary: ['chest'], secondary: ['triceps'], activationWeights: { primary: { chest: 1 }, secondary: { triceps: 0.5 } } },
  { id: 'fly', name: 'Cable Fly', equipment: 'Cable', primary: ['chest'], secondary: [], activationWeights: { primary: { chest: 0.8 }, secondary: {} } },
]

const workout = (date, weight, reps = 10) => ({
  id: date, completedAt: `${date}T12:00:00.000Z`, exercises: [
    { exerciseId: 'press', sets: [{ kg: weight, reps, rpe: 8, done: true }, { kg: weight, reps, rpe: 9, done: true }] },
    { exerciseId: 'fly', sets: [{ kg: 20, reps: 12, rpe: 7, done: true }] },
  ],
})

test('buildMuscleHistory calculates records, favorites, frequency and DNA contribution', () => {
  const history = buildMuscleHistory([workout('2026-07-20', 80), workout('2026-07-26', 85)], library, 'chest', { now: '2026-07-27T12:00:00.000Z' })
  assert.equal(history.trainingFrequency, 2)
  assert.equal(history.daysSinceLastTrained, 1)
  assert.equal(history.bestWeight, 85)
  assert.equal(history.averageReps, 10.7)
  assert.equal(history.favoriteExercise.mostUsed, 'Incline Press')
  assert.equal(history.favoriteExercise.bestPerforming, 'Incline Press')
  assert.equal(history.mostCommonEquipment, 'Barbell')
  assert.ok(history.contributions[0].percentage > history.contributions[1].percentage)
  assert.equal(history.recentExercises[0].sets, 4)
})

test('trend calculation distinguishes improving, stable, and declining histories', () => {
  const now = '2026-07-27T12:00:00.000Z'
  const improving = buildMuscleHistory([workout('2026-06-23', 20), workout('2026-07-26', 80)], library, 'chest', { now })
  const stable = buildMuscleHistory([workout('2026-06-23', 80), workout('2026-07-26', 80)], library, 'chest', { now })
  const declining = buildMuscleHistory([workout('2026-06-23', 80), workout('2026-07-26', 20)], library, 'chest', { now })
  assert.equal(improving.trend.direction, 'improving')
  assert.equal(stable.trend.direction, 'stable')
  assert.equal(declining.trend.direction, 'declining')
})

test('progress detection returns weight, volume, rep, 1RM and consistency records', () => {
  const result = detectProgression([workout('2026-07-25', 80, 8), workout('2026-07-26', 85, 10)], library)
  const types = new Set(result.records.filter(record => record.exerciseId === 'press').map(record => record.type))
  assert.deepEqual(types, new Set(['volume', 'weight', 'reps', 'estimated1RM']))
  assert.equal(result.longestStreak, 2)
  assert.equal(result.mostConsistentMuscle, 'chest')
  assert.equal(result.hasNewPr, true)
})

test('completion feedback is structured and empty history is safe', () => {
  assert.equal(buildMuscleHistory([], library, 'chest', { now: '2026-07-27' }).recentExercises.length, 0)
  const feedback = buildWorkoutCompletionFeedback([workout('2026-07-26', 80), workout('2026-07-27', 85)], library, { overallFatigue: 75 })
  assert.deepEqual(feedback.musclesImproved, ['chest', 'triceps'])
  assert.equal(feedback.recoveryImpact, 'high')
  assert.ok(feedback.volumeAdded > 0)
  assert.ok(feedback.newPr.length > 0)
})

test('large history remains deterministic', () => {
  const workouts = Array.from({ length: 5000 }, (_, index) => workout(new Date(Date.UTC(2012, 0, 1 + index)).toISOString().slice(0, 10), 50 + index % 50))
  const first = buildMuscleHistory(workouts, library, 'chest', { now: '2026-07-27T12:00:00.000Z' })
  const second = buildMuscleHistory(workouts, library, 'chest', { now: '2026-07-27T12:00:00.000Z' })
  assert.deepEqual(first, second)
})
