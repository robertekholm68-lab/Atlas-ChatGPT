export function generateNutritionInsights(intelligence = {}) {
  const { macros = {}, targets = {}, hydration = {}, micronutrients = {}, timing = {}, score = {} } = intelligence
  const insights = []
  if (macros.protein < (targets.protein || 0) * .8) insights.push({ type: 'protein_low', priority: 'high', message: 'Protein too low.', action: `Add ${Math.ceil((targets.protein - macros.protein) / 5) * 5} g protein.` })
  if (macros.fiber < (targets.fiber || 0) * .8) insights.push({ type: 'fiber_low', priority: 'medium', message: 'Fiber below target.', action: 'Add vegetables, legumes, fruit, or whole grains.' })
  insights.push(hydration.score >= 80 ? { type: 'hydration_improving', priority: 'positive', message: 'Hydration improving.' } : { type: 'hydration_low', priority: 'high', message: 'Hydration below target.', action: `Drink ${Math.max(0, hydration.target - hydration.effectiveWater)} ml more.` })
  if (timing.carbsWellTimed) insights.push({ type: 'carbs_timed', priority: 'positive', message: 'Carbs well timed.' })
  if (timing.recoveryWindowMet) insights.push({ type: 'recovery_nutrition', priority: 'positive', message: 'Recovery nutrition excellent.' })
  if (micronutrients.deficiencies?.length) insights.push({ type: 'micronutrient_gap', priority: 'medium', message: `${micronutrients.deficiencies[0].nutrient} intake is below target.`, nutrients: micronutrients.deficiencies.slice(0, 3).map(item => item.nutrient) })
  if (score.score >= 85) insights.push({ type: 'nutrition_quality', priority: 'positive', message: 'Nutrition quality is excellent.' })
  return Object.freeze(insights.map(Object.freeze))
}

export function buildCoachNutritionContext(intelligence = {}) {
  return Object.freeze({ score: intelligence.score?.score ?? 0, protein: intelligence.macros?.protein ?? 0, calories: intelligence.macros?.calories ?? 0, hydrationScore: intelligence.hydration?.score ?? 0, recoveryWindowMet: intelligence.timing?.recoveryWindowMet ?? false, deficiencies: intelligence.micronutrients?.deficiencies?.map(item => item.nutrient) ?? [], recommendations: intelligence.insights?.slice(0, 3).map(item => item.message) ?? [] })
}
