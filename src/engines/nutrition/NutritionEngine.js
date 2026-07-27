import { calculateDailyTarget, calculateMacros, calculateWeeklyAverage } from './MacroEngine.js'
import { calculateMicronutrients } from './MicroEngine.js'
import { evaluateMealTiming } from './MealEngine.js'
import { calculateHydration } from './HydrationEngine.js'
import { calculateNutritionScore } from './NutritionScoreEngine.js'
import { buildCoachNutritionContext, generateNutritionInsights } from './NutritionInsightsEngine.js'
import { createNutritionDay } from './NutritionModels.js'
import { calculateEnergyBalance } from './EnergyBalanceEngine.js'
import { buildRecoveryNutrition, recommendMeals } from './MealRecommendationEngine.js'
import { planMealWeek } from './MealPlannerEngine.js'
import { createShoppingList } from './ShoppingEngine.js'

export const SUPPORTED_NUTRITION_GOALS = Object.freeze(['fat_loss', 'maintenance', 'muscle_gain', 'performance', 'recomposition'])

export function buildNutritionIntelligence(input = {}) {
  const day = createNutritionDay(input.day ?? input)
  const goal = SUPPORTED_NUTRITION_GOALS.includes(input.goal) ? input.goal : 'maintenance'
  const recommended = calculateDailyTarget(input.profile, goal)
  const targets = Object.freeze({ ...day.targets, ...recommended, ...(input.targets ?? {}), micronutrients: day.targets.micronutrients })
  const macros = calculateMacros(day.meals)
  const micronutrients = calculateMicronutrients(day.meals, targets.micronutrients)
  const hydration = calculateHydration(day.hydration, targets.water)
  const timing = evaluateMealTiming(day.meals, input.workout)
  const score = calculateNutritionScore({ macros, targets, hydration, micronutrients, meals: day.meals, consistency: input.consistency })
  const energyBalance = calculateEnergyBalance({
    caloriesIn: macros.calories, basalCalories: input.energy?.basalCalories ?? input.profile?.basalCalories,
    activeCalories: input.energy?.activeCalories ?? input.workout?.activeCalories,
    thermicEffect: input.energy?.thermicEffect, history: input.energyHistory, currentWeightKg: input.profile?.weightKg,
  })
  const mealRecommendations = recommendMeals({ recipes: input.recipes, preferences: input.preferences, macros, targets, workout: input.workout })
  const recoverySupport = buildRecoveryNutrition({ workout: input.workout, hydration, targets, macros })
  const mealPlan = input.recipes?.length ? planMealWeek({ recipes: input.recipes, preferences: input.preferences, targets, workouts: input.workouts ?? (input.workout ? [input.workout] : []), startDate: input.planStartDate ?? day.date, mealsPerDay: input.mealsPerDay }) : null
  const shoppingList = mealPlan ? createShoppingList(mealPlan) : null
  const base = { day, goal, targets, macros, micronutrients, hydration, timing, score, energyBalance, mealRecommendations, recoverySupport, mealPlan, shoppingList, weeklyAverage: calculateWeeklyAverage(input.history ?? [day]) }
  const insights = generateNutritionInsights(base)
  const bodySignals = Object.freeze({ energyAvailability: targets.calories ? Math.min(100, Math.round(macros.calories / targets.calories * 100)) : 0, hydration: hydration.score, nutritionQuality: score.score })
  const recoverySignals = Object.freeze({ proteinAdequacy: targets.protein ? Math.min(100, Math.round(macros.protein / targets.protein * 100)) : 0, hydration: hydration.score, calorieAdequacy: targets.calories ? Math.min(100, Math.round(macros.calories / targets.calories * 100)) : 0, mealTiming: timing.recoveryWindowMet ? 100 : timing.carbsWellTimed ? 75 : 40 })
  const intelligence = Object.freeze({ ...base, insights, bodySignals, recoverySignals })
  return Object.freeze({ ...intelligence, coachContext: buildCoachNutritionContext(intelligence) })
}

export const createNutritionIntelligence = buildNutritionIntelligence
