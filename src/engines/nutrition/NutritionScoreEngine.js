const clamp = value => Math.min(100, Math.max(0, Math.round(value)))
const targetScore = (value, target, upper = false) => target <= 0 ? 100 : clamp(upper ? (value <= target ? 100 : 100 - (value / target - 1) * 80) : value / target * 100)

export function calculateNutritionScore(input = {}) {
  const { macros = {}, targets = {}, hydration = {}, micronutrients = {}, meals = [] } = input
  const macroBalance = clamp(100 - Math.abs((macros.distribution?.protein ?? 25) - 25) * 2 - Math.abs((macros.distribution?.fat ?? 30) - 30))
  const factors = Object.freeze({ macroBalance, protein: targetScore(macros.protein, targets.protein), fiber: targetScore(macros.fiber, targets.fiber), hydration: hydration.score ?? 0, micronutrients: micronutrients.score ?? 0, foodQuality: meals.length ? clamp(meals.reduce((sum, meal) => sum + meal.qualityScore, 0) / meals.length) : 0, consistency: clamp(input.consistency ?? (meals.length >= 3 ? 80 : meals.length * 20)) })
  const weights = { macroBalance: .15, protein: .18, fiber: .12, hydration: .15, micronutrients: .15, foodQuality: .15, consistency: .1 }
  const score = clamp(Object.entries(factors).reduce((sum, [key, value]) => sum + value * weights[key], 0))
  return Object.freeze({ score, grade: score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'developing' : 'needs_attention', factors })
}
