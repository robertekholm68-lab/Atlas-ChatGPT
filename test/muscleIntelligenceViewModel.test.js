import test from 'node:test'
import assert from 'node:assert/strict'

import { exerciseLibrary } from '../src/workoutData.js'
import { buildMuscleIntelligenceViewModel } from '../src/muscleIntelligenceViewModel.js'

const now = new Date('2026-07-24T12:00:00.000Z')

function session(sets) {
  return [{ completedAt: now.toISOString(), exercises: [{ exerciseId: 'bench-press', sets }] }]
}

test('muscle view model orders every muscle by effective sets and selects a muscle', () => {
  const view = buildMuscleIntelligenceViewModel(session([{ weight: 100, reps: 8, rpe: 9 }]), exerciseLibrary, 'triceps', now)
  assert.equal(view.muscles.length, 10)
  assert.equal(view.muscles[0].id, 'chest')
  assert.equal(view.selectedMuscle.id, 'triceps')
  assert.equal(view.selectedMuscle.weeklyVolume, 520)
})

test('muscle view model updates volume and selected facts after another completed set', () => {
  const before = buildMuscleIntelligenceViewModel(session([{ weight: 100, reps: 8, rpe: 9 }]), exerciseLibrary, 'chest', now)
  const after = buildMuscleIntelligenceViewModel(session([{ weight: 100, reps: 8, rpe: 9 }, { weight: 100, reps: 8, rpe: 9 }]), exerciseLibrary, 'chest', now)
  assert.equal(after.selectedMuscle.effectiveSets, before.selectedMuscle.effectiveSets * 2)
  assert.equal(after.selectedMuscle.weeklyVolume, before.selectedMuscle.weeklyVolume * 2)
})

test('muscle view model safely falls back for an unknown selection and empty history', () => {
  const view = buildMuscleIntelligenceViewModel([], exerciseLibrary, 'unknown', now)
  assert.equal(view.muscles[0].effectiveSets, 0)
  assert.equal(view.selectedMuscle.name, 'Biceps')
  assert.equal(view.selectedMuscle.lastTrainedLabel, 'Not trained this week')
})
