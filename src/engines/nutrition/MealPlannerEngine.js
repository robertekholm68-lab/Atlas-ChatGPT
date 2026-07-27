import { rankRecipes } from './RecipeEngine.js'

const DAY_NAMES = Object.freeze(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])

export function planMealWeek({ recipes = [], preferences = {}, targets = {}, workouts = [], startDate, mealsPerDay = 3 } = {}) {
  mealsPerDay = Math.max(1, Number(mealsPerDay) || 3)
  const ranked = rankRecipes(recipes, preferences).map(item => item.recipe)
  if (!ranked.length) return Object.freeze({ startDate: startDate ?? null, days: Object.freeze([]), targets: Object.freeze({ ...targets }), warnings: Object.freeze(['No recipes match the current preferences.']) })
  const familySize = Math.max(1, Number(preferences.familySize) || 1)
  const days = DAY_NAMES.map((name, dayIndex) => {
    const workout = workouts.find(item => item.day === name || item.date === dateAt(startDate, dayIndex)) ?? null
    const meals = Array.from({ length: Math.max(1, mealsPerDay) }, (_, mealIndex) => {
      const recipe = ranked[(dayIndex * mealsPerDay + mealIndex) % ranked.length]
      return Object.freeze({ recipeId: recipe.id, recipe, servings: familySize, type: mealIndex === 0 ? 'breakfast' : mealIndex === mealsPerDay - 1 ? 'dinner' : 'lunch', workoutAdapted: Boolean(workout) })
    })
    return Object.freeze({ day: name, date: dateAt(startDate, dayIndex), workout, meals: Object.freeze(meals), totals: totalMeals(meals) })
  })
  return Object.freeze({ startDate: startDate ?? null, days: Object.freeze(days), targets: Object.freeze({ ...targets }), warnings: Object.freeze([]) })
}

function dateAt(startDate, offset) {
  if (!startDate) return null
  const date = new Date(`${String(startDate).slice(0, 10)}T12:00:00Z`)
  if (!Number.isFinite(date.getTime())) return null
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

function totalMeals(meals) {
  return Object.freeze(['calories', 'protein', 'carbs', 'fat'].reduce((totals, key) => ({ ...totals, [key]: Math.round(meals.reduce((sum, meal) => sum + meal.recipe[key], 0)) }), {}))
}
