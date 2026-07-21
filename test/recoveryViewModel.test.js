import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRecoveryViewModel } from '../src/recoveryViewModel.js'

test('builds recovery guidance from check-in and core muscle load', () => {
  const vm = buildRecoveryViewModel({
    readiness: 48,
    profile: { checkIn: { sleep: 5.8, stress: 6, soreness: 8, energy: 4, pain: 'none' } },
    core: { recovery: { muscles: { Rygg: { fatigue: 72 }, Bröst: { fatigue: 12 } } }, workouts: [{ id: 'w1', name: 'Pull', sets: 16 }] }
  })

  assert.equal(vm.tone, 'recover')
  assert.equal(vm.mostLoaded.name, 'Rygg')
  assert.equal(vm.freshest.name, 'Bröst')
  assert.match(vm.advice, /Prioritera återhämtning/)
  assert.equal(vm.recentWorkouts[0].name, 'Pull')
})

test('does not invent muscle recovery when core data is empty', () => {
  const vm = buildRecoveryViewModel({ profile: { checkIn: { sleep: 7.5, stress: 2, soreness: 2, energy: 8 } }, core: { recovery: { muscles: {} }, workouts: [] } })

  assert.equal(vm.hasCoreRecovery, false)
  assert.equal(vm.muscles.length, 0)
  assert.equal(vm.score, 100)
  assert.equal(vm.tone, 'ready')
})
