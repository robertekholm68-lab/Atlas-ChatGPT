import test from 'node:test'
import assert from 'node:assert/strict'
import { buildHomeViewModel, safeHomeTarget } from '../src/atlasHomeModel.js'

const populatedCore = {
  recovery: { score: 82, muscles: { Rygg: { fatigue: 20 }, Bröst: { fatigue: 46 }, Vader: { fatigue: 78 } } },
  workouts: [{ name: 'Överkropp A', completedAt: '2026-07-20T18:00:00Z', sets: 16 }],
  goalPlans: { active: { weeklySessions: 4 } }
}
const profile = { name: 'Robert Ekholm', checkIn: { sleep: 7.4, energy: 8, motivation: 7 }, goal: { weeklySessions: 4 } }
const recommendation = { headline: 'Rygg är redo för kvalitetsträning', summary: 'Kör planerat pass med kontrollerad volym.', confidence: .82, confidenceLabel: 'hög', primaryActionLabel: 'STARTA PASS', primaryActionTarget: 'training', alternatives: [{ label: 'Visa programmet', target: 'goal' }], dataQuality: { label: 'stark', signals: 5, possibleSignals: 6 }, context: { firstName: 'Robert', recoveryScore: 82, weeklyCompletion: 2, latestWorkout: populatedCore.workouts[0] }, decision: { title: 'Överkropp · styrka', message: 'Rygg har bäst återhämtning.' } }


test('populated Home screen view model contains approved hierarchy data', () => {
  const vm = buildHomeViewModel({ profile, core: populatedCore, recommendation, readiness: 82, now: new Date('2026-07-21T07:00:00Z') })
  assert.equal(vm.greeting, 'God morgon, Robert')
  assert.equal(vm.headline, 'Rygg är redo för kvalitetsträning')
  assert.equal(vm.latest.name, 'Överkropp A')
  assert.ok(vm.metrics.some(metric => metric.label === 'Återhämtning'))
  assert.ok(vm.muscles.some(muscle => muscle.name === 'Vader'))
})

test('insufficient-data Home screen and empty latest workout are honest', () => {
  const vm = buildHomeViewModel({ profile, core: { recovery: { muscles: {} }, workouts: [] }, recommendation: { insufficientData: true, context: {}, dataQuality: { label: 'otillräcklig', signals: 0, possibleSignals: 6 } } })
  assert.equal(vm.insufficient, true)
  assert.equal(vm.latest, null)
  assert.equal(vm.muscles.length, 0)
})

test('missing daily-check-in values are hidden without undefined null or NaN text', () => {
  const vm = buildHomeViewModel({ profile: { name: 'Ava Atlas', checkIn: {}, goal: {} }, core: populatedCore, recommendation })
  const text = JSON.stringify(vm)
  assert.doesNotMatch(text, /undefined|null|NaN/)
  assert.equal(vm.metrics.some(metric => metric.label === 'Energi'), false)
  assert.equal(vm.metrics.some(metric => metric.label === 'Sömn'), false)
})

test('primary action navigation falls back when target is invalid', () => {
  const vm = buildHomeViewModel({ profile, core: populatedCore, recommendation: { ...recommendation, primaryActionTarget: 'workout-detail/missing' } })
  assert.equal(vm.primaryTarget, 'coach')
  assert.equal(vm.workoutTarget, 'goal')
})

test('valid primary action navigation is preserved', () => {
  const vm = buildHomeViewModel({ profile, core: populatedCore, recommendation: { ...recommendation, primaryActionTarget: 'recovery' } })
  assert.equal(vm.primaryTarget, 'recovery')
})

test('bottom-navigation active state target helper accepts only valid pages', () => {
  assert.equal(safeHomeTarget('today'), 'today')
  assert.equal(safeHomeTarget('missing', 'today'), 'today')
})

test('legacy sparse saved state remains compatible', () => {
  const vm = buildHomeViewModel({ profile: {}, core: { recovery: {}, workouts: [] }, recommendation: {} })
  assert.equal(vm.greeting.includes('du'), true)
  assert.equal(vm.latest, null)
})
