import assert from 'node:assert/strict'
import test from 'node:test'
import { buildRecoveryViewModel } from '../src/core/recoveryEngine.js'

const now = new Date('2026-07-21T12:00:00Z').getTime()

test('recovery view model answers today with local ATLAS data', () => {
  const vm = buildRecoveryViewModel({
    workouts: [{
      id: 'w1', name: 'Underkropp A', completedAt: '2026-07-20T18:00:00Z', sets: 16,
      exercises: [{ name: 'Squat', muscleContribution: { Ben: 1, Säte: .6 }, sets: [{ reps: 8, rpe: 9 }] }]
    }],
    recovery: { score: 64, muscles: { 'Framsida lår': { fatigue: 52, updatedAt: '2026-07-20T18:00:00Z' }, Bröst: { fatigue: 8, updatedAt: '2026-07-18T18:00:00Z' } } }
  }, now)

  assert.equal(vm.score, 64)
  assert.equal(vm.recommendation, 'ACTIVE RECOVERY')
  assert.equal(vm.color, 'orange')
  assert.equal(vm.breakdown.length, 7)
  assert.ok(vm.decision.includes('Avoid heavy'))
  assert.equal(vm.timeline[1].label, 'Today')
  assert.equal(vm.factors.length, 5)
})
