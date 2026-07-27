import test from 'node:test'
import assert from 'node:assert/strict'
import {
  NutritionStorage, addMeal, buildNutritionIntelligence, calculateDailyTarget, calculateMacros,
  calculateNutritionScore, createNutritionDay, evaluateMealTiming, nutritionMockProfiles,
} from '../src/engines/nutrition/index.js'
import { buildRecoverySnapshot } from '../src/engines/recovery/RecoveryIntelligenceEngine.js'
import { makeCoachDecision } from '../src/engines/CoachDecisionEngine.js'

test('MacroEngine totals nutrients and derives calorie distribution without mutating meals', () => {
  const meals = [{ protein: 30, carbs: 40, fat: 10, calories: 370 }, { protein: 20, carbs: 10, fat: 5, calories: 165 }]
  const before = JSON.stringify(meals)
  const result = calculateMacros(meals)
  assert.equal(result.calories, 535)
  assert.equal(result.protein, 50)
  assert.equal(result.distribution.protein, 37.4)
  assert.equal(JSON.stringify(meals), before)
})

test('NutritionScore produces a bounded, explainable 0–100 score', () => {
  const result = calculateNutritionScore({ macros: { protein: 150, fiber: 30, distribution: { protein: 25, fat: 30 } }, targets: { protein: 150, fiber: 30 }, hydration: { score: 100 }, micronutrients: { score: 100 }, meals: [{ qualityScore: 90 }], consistency: 90 })
  assert.ok(result.score >= 90 && result.score <= 100)
  assert.equal(result.factors.protein, 100)
})

test('MealEngine supports meal sources, chronological logging, and workout timing', () => {
  const day = createNutritionDay({ date: '2026-07-27' })
  const logged = addMeal(day, { id: 'post', type: 'post_workout', source: 'ai_estimate', eatenAt: '2026-07-27T11:30:00Z', protein: 30, carbs: 45 })
  const withPre = addMeal(logged, { id: 'pre', type: 'pre_workout', source: 'saved_meal', eatenAt: '2026-07-27T09:00:00Z', protein: 15, carbs: 40 })
  assert.deepEqual(withPre.meals.map(meal => meal.id), ['pre', 'post'])
  assert.deepEqual(evaluateMealTiming(withPre.meals, { startedAt: '2026-07-27T10:00:00Z' }), { preWorkout: withPre.meals[0], postWorkout: withPre.meals[1], carbsWellTimed: true, recoveryWindowMet: true })
})

test('NutritionStorage persists, replaces by date, hydrates, and queries ranges', () => {
  const storage = new NutritionStorage([nutritionMockProfiles.athlete])
  storage.save(nutritionMockProfiles.lowProtein)
  assert.equal(storage.size, 1)
  const restored = NutritionStorage.hydrate(storage.serialize())
  assert.equal(restored.latest().id, 'low_protein')
  assert.equal(restored.between('2026-07-01', '2026-07-31').length, 1)
})

test('NutritionEngine exposes recovery, body, coach, insights, and goal-adjusted targets', () => {
  const result = buildNutritionIntelligence({ day: nutritionMockProfiles.poorHydration, goal: 'performance', profile: { weightKg: 80, maintenanceCalories: 2600 }, workout: { startedAt: '2026-07-27T12:00:00Z' } })
  assert.equal(result.targets.calories, 2800)
  assert.ok(result.bodySignals.energyAvailability > 0)
  assert.ok(result.recoverySignals.proteinAdequacy > 0)
  assert.equal(result.coachContext.hydrationScore, result.hydration.score)
  assert.ok(result.insights.some(insight => insight.type === 'hydration_low'))
})

test('goal recommendations adapt calories and protein for all nutrition goals', () => {
  const profile = { weightKg: 80, maintenanceCalories: 2400 }
  assert.ok(calculateDailyTarget(profile, 'fat_loss').calories < calculateDailyTarget(profile, 'maintenance').calories)
  assert.ok(calculateDailyTarget(profile, 'muscle_gain').calories > calculateDailyTarget(profile, 'maintenance').calories)
  assert.ok(calculateDailyTarget(profile, 'recomposition').protein > calculateDailyTarget(profile, 'maintenance').protein)
})

test('Recovery and Coach consume nutrition intelligence', () => {
  const nutrition = buildNutritionIntelligence({ day: nutritionMockProfiles.poorHydration })
  const recovery = buildRecoverySnapshot({ timestamp: '2026-07-27T12:00:00Z', nutrition })
  assert.equal(recovery.nutrition.hydration, nutrition.hydration.score)
  assert.ok(recovery.score.contributors.some(item => item.factor === 'nutrition'))
  const decision = makeCoachDecision({ nutritionIntelligence: nutrition, workoutHistory: [{ completedAt: '2026-07-26' }] })
  assert.equal(decision.decision, 'recovery')
  assert.ok(decision.reasonCodes.includes('NUTRITION_SUPPORT_NEEDED'))
})

test('all requested nutrition mock scenarios can be evaluated', () => {
  assert.deepEqual(Object.keys(nutritionMockProfiles), ['athlete', 'officeWorker', 'fatLoss', 'bulking', 'highProtein', 'lowProtein', 'vegetarian', 'poorHydration'])
  Object.values(nutritionMockProfiles).forEach(day => assert.doesNotThrow(() => buildNutritionIntelligence({ day })))
})
