export function generateNutritionInsights(intelligence = {}) {
  const { macros = {}, targets = {}, hydration = {}, micronutrients = {}, timing = {}, score = {}, weeklyAverage = {}, energyBalance = {} } = intelligence
  const insights = []
  if (macros.protein < (targets.protein || 0) * .8) insights.push({ type: 'protein_low', priority: 'high', message: 'Protein too low.', action: `Add ${Math.ceil((targets.protein - macros.protein) / 5) * 5} g protein.` })
  if (macros.fiber < (targets.fiber || 0) * .8) insights.push({ type: 'fiber_low', priority: 'medium', message: 'Fiber below target.', action: 'Add vegetables, legumes, fruit, or whole grains.' })
  insights.push(hydration.score >= 80 ? { type: 'hydration_improving', priority: 'positive', message: 'Hydration improving.' } : { type: 'hydration_low', priority: 'high', message: 'Hydration below target.', action: `Drink ${Math.max(0, hydration.target - hydration.effectiveWater)} ml more.` })
  if (timing.carbsWellTimed) insights.push({ type: 'carbs_timed', priority: 'positive', message: 'Carbs well timed.' })
  if (timing.recoveryWindowMet) insights.push({ type: 'recovery_nutrition', priority: 'positive', message: 'Recovery nutrition excellent.' })
  if ((weeklyAverage.protein ?? 0) >= (targets.protein || 0) * .9) insights.push({ type: 'protein_trend', priority: 'positive', message: 'Protein intake supports your current target.' })
  if ((weeklyAverage.carbs ?? 0) < (targets.carbs || 0) * .75) insights.push({ type: 'carb_workload_gap', priority: 'medium', message: 'Carbohydrate intake is low for your current workload.', action: 'Add carbohydrates around your next training session.' })
  if (energyBalance.weeklyTrend < -3500) insights.push({ type: 'energy_deficit', priority: 'high', message: 'Your predicted weekly energy deficit is high.', action: 'Increase intake unless this matches your current plan.' })
  if (micronutrients.deficiencies?.length) insights.push({ type: 'micronutrient_gap', priority: 'medium', message: `${micronutrients.deficiencies[0].nutrient} intake is below target.`, nutrients: micronutrients.deficiencies.slice(0, 3).map(item => item.nutrient) })
  if (score.score >= 85) insights.push({ type: 'nutrition_quality', priority: 'positive', message: 'Nutrition quality is excellent.' })
  return Object.freeze(insights.map(Object.freeze))
}

export function buildCoachNutritionContext(intelligence = {}) {
  return Object.freeze({ score: intelligence.score?.score ?? 0, protein: intelligence.macros?.protein ?? 0, calories: intelligence.macros?.calories ?? 0, hydrationScore: intelligence.hydration?.score ?? 0, recoveryWindowMet: intelligence.timing?.recoveryWindowMet ?? false, deficiencies: intelligence.micronutrients?.deficiencies?.map(item => item.nutrient) ?? [], energyBalance: intelligence.energyBalance?.predictedBalance ?? 0, mealRecommendations: intelligence.mealRecommendations?.map(item => item.recipe.name) ?? [], recommendations: intelligence.insights?.slice(0, 3).map(item => item.action ?? item.message) ?? [] })
}
