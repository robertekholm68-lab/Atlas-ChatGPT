import { MICRONUTRIENT_TARGETS } from './NutritionModels.js'

export function calculateMicronutrients(meals = [], targets = MICRONUTRIENT_TARGETS) {
  const totals = Object.fromEntries(Object.keys(targets).map(key => [key, meals.reduce((sum, meal) => sum + (Number(meal.micronutrients?.[key]) || 0), 0)]))
  const coverage = Object.fromEntries(Object.entries(targets).map(([key, target]) => [key, Math.min(100, Math.round((totals[key] / target) * 100))]))
  const deficiencies = Object.entries(coverage).filter(([, percentage]) => percentage < 80).map(([nutrient, percentage]) => Object.freeze({ nutrient, amount: totals[nutrient], target: targets[nutrient], percentage, severity: percentage < 50 ? 'high' : 'moderate' })).sort((a, b) => a.percentage - b.percentage)
  const score = Object.values(coverage).length ? Math.round(Object.values(coverage).reduce((sum, value) => sum + value, 0) / Object.values(coverage).length) : 0
  return Object.freeze({ totals: Object.freeze(totals), coverage: Object.freeze(coverage), deficiencies: Object.freeze(deficiencies), score })
}
