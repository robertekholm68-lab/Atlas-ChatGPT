import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCoachPlatformViewModel, buildCoachContext, coachMemorySchema, coachPersonalities, goalTypes } from '../src/core/aiCoachPlatform.js'

test('AI Coach platform exposes provider-neutral architecture', () => {
  const vm = buildCoachPlatformViewModel({ workouts: [{ name: 'Upper Strength' }], recovery: { score: 84 } }, { name: 'Robert' })
  assert.equal(vm.decisionModel.status, 'architecture_ready')
  assert.ok(vm.decisionModel.inputs.includes('mood_placeholder'))
  assert.ok(vm.decisionModel.inputs.includes('stress_placeholder'))
  assert.ok(vm.dashboard.priorities.length >= 3)
  assert.ok(vm.recommendations.includes('Deload week'))
})

test('coach personalities goals context and memory schemas are reusable', () => {
  assert.deepEqual(Object.keys(coachPersonalities), ['supportive', 'balanced', 'strict', 'scientific', 'minimal', 'motivational'])
  assert.ok(goalTypes.includes('custom'))
  assert.ok(Object.keys(coachMemorySchema).includes('conversationMemory'))
  const context = buildCoachContext({}, { preferences: { personality: 'scientific' } })
  assert.equal(context.preferences.personality, 'scientific')
  assert.ok(context.workoutPlatform)
  assert.ok(context.nutritionPlatform)
  assert.ok(context.recoveryPlatform)
  assert.ok(context.progressPlatform)
})
