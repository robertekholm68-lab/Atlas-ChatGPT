import test from 'node:test'
import assert from 'node:assert/strict'
import {
  NutritionStorage, addMeal, buildNutritionIntelligence, calculateDailyTarget, calculateMacros,
  calculateEnergyBalance, calculateNutritionScore, createNutritionDay, createShoppingList,
  evaluateMealTiming, filterRecipes, nutritionMockProfiles, planMealWeek, recommendMeals,
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

const recipes = [{ id: 'bowl', name: 'Chicken rice bowl', calories: 620, protein: 48, carbs: 70, fat: 16, prepTime: 25, cost: 6, cuisine: 'asian', diet: ['gluten-free'], servings: 2, ingredients: [{ name: 'Chicken', amount: 400, unit: 'g', category: 'protein' }, { name: 'Rice', amount: 200, unit: 'g', category: 'pantry' }] }, { id: 'pasta', name: 'Peanut pasta', calories: 760, protein: 30, prepTime: 40, cost: 8, allergens: ['peanut'] }]

test('RecipeEngine filters dietary, time, budget, protein, cuisine, and allergy constraints', () => {
  assert.deepEqual(filterRecipes(recipes, { minProtein: 40, maxPrepTime: 30, maxBudget: 7, cuisine: 'asian', diet: 'gluten-free', allergies: ['peanut'] }).map(recipe => recipe.id), ['bowl'])
  assert.equal(recommendMeals({ recipes, preferences: { allergies: ['peanut'], favoriteFoods: ['chicken'] }, targets: { protein: 150 }, macros: { protein: 90 } })[0].recipe.id, 'bowl')
})

test('MealPlanner and Shopping engines create a family-aware grouped weekly plan', () => {
  const plan = planMealWeek({ recipes: [recipes[0]], preferences: { familySize: 4 }, startDate: '2026-07-27' })
  const shopping = createShoppingList(plan)
  assert.equal(plan.days.length, 7)
  assert.equal(plan.days[0].date, '2026-07-27')
  assert.equal(shopping.categories.protein[0].amount, 16800)
  assert.equal(shopping.generatedFromDays, 7)
})

test('EnergyBalance predicts weekly balance and body-weight direction', () => {
  const energy = calculateEnergyBalance({ caloriesIn: 2200, basalCalories: 1800, activeCalories: 500, currentWeightKg: 80, history: Array(6).fill({ balance: -300 }) })
  assert.equal(energy.caloriesOut, 2520)
  assert.equal(energy.predictedBalance, -320)
  assert.ok(energy.bodyWeightForecastKg < 80)
})

test('NutritionEngine composes meal planning, shopping, recovery and coach updates', () => {
  const result = buildNutritionIntelligence({ day: nutritionMockProfiles.athlete, recipes, preferences: { allergies: ['peanut'], familySize: 2 }, workout: { day: 'monday', durationMinutes: 75, activeCalories: 600 }, profile: { weightKg: 80, basalCalories: 1800 } })
  assert.equal(result.mealPlan.days.length, 7)
  assert.ok(result.shoppingList.items.length)
  assert.equal(result.recoverySupport.electrolytes.recommended, true)
  assert.deepEqual(result.coachContext.mealRecommendations, ['Chicken rice bowl'])
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
