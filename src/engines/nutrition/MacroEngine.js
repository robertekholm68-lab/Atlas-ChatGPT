const FIELDS = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'alcohol', 'sodium', 'potassium']
const round = value => Math.round(value * 10) / 10

export function calculateMacros(meals = []) {
  const totals = Object.fromEntries(FIELDS.map(field => [field, round(meals.reduce((sum, meal) => sum + (Number(meal?.[field]) || 0), 0))]))
  const macroCalories = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9 + totals.alcohol * 7
  const distribution = macroCalories ? Object.freeze({ protein: round(totals.protein * 400 / macroCalories), carbs: round(totals.carbs * 400 / macroCalories), fat: round(totals.fat * 900 / macroCalories), alcohol: round(totals.alcohol * 700 / macroCalories) }) : Object.freeze({ protein: 0, carbs: 0, fat: 0, alcohol: 0 })
  const mealTiming = meals.map(meal => ({ id: meal.id, type: meal.type, eatenAt: meal.eatenAt ?? null, calories: meal.calories })).sort((a, b) => String(a.eatenAt ?? '').localeCompare(String(b.eatenAt ?? '')))
  return Object.freeze({ ...totals, distribution, mealTiming: Object.freeze(mealTiming) })
}

export function calculateWeeklyAverage(days = []) {
  if (!days.length) return calculateMacros([])
  const aggregate = calculateMacros(days.flatMap(day => day.meals ?? []))
  return Object.freeze(Object.fromEntries([...FIELDS, 'distribution'].map(field => [field, field === 'distribution' ? aggregate.distribution : round(aggregate[field] / days.length)])))
}

export function calculateDailyTarget(profile = {}, goal = 'maintenance') {
  const weight = Math.max(1, Number(profile.weightKg) || 70)
  const activity = Math.max(1.2, Number(profile.activityFactor) || 1.5)
  const maintenance = Number(profile.maintenanceCalories) || weight * 22 * activity
  const adjustment = { fat_loss: -400, maintenance: 0, muscle_gain: 300, performance: 200, recomposition: -100 }[goal] ?? 0
  const proteinPerKg = { fat_loss: 2.2, maintenance: 1.6, muscle_gain: 2, performance: 1.8, recomposition: 2.2 }[goal] ?? 1.6
  const calories = Math.round(maintenance + adjustment); const protein = Math.round(weight * proteinPerKg); const fat = Math.round(weight * .8)
  return Object.freeze({ calories, protein, fat, carbs: Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4)), fiber: Math.max(25, Math.round(calories / 1000 * 14)), goal })
}
