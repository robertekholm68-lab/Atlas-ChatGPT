import { createMeal } from './NutritionModels.js'

export const addMeal = (day, meal) => Object.freeze({ ...day, meals: Object.freeze([...(day.meals ?? []), createMeal(meal)].sort((a, b) => a.eatenAt.localeCompare(b.eatenAt))) })
export const updateMeal = (day, id, updates) => Object.freeze({ ...day, meals: Object.freeze((day.meals ?? []).map(meal => meal.id === id ? createMeal({ ...meal, ...updates, id }) : meal)) })
export const removeMeal = (day, id) => Object.freeze({ ...day, meals: Object.freeze((day.meals ?? []).filter(meal => meal.id !== id)) })
export const groupMeals = (meals = []) => Object.freeze(Object.fromEntries(meals.reduce((groups, meal) => { const list = groups.get(meal.type) ?? []; list.push(meal); groups.set(meal.type, list); return groups }, new Map())))

export function evaluateMealTiming(meals = [], workout = {}) {
  const workoutAt = new Date(workout.startedAt ?? workout.scheduledAt).getTime()
  if (!Number.isFinite(workoutAt)) return Object.freeze({ preWorkout: null, postWorkout: null, carbsWellTimed: false, recoveryWindowMet: false })
  const candidates = meals.map(meal => ({ meal, hours: (new Date(meal.eatenAt).getTime() - workoutAt) / 3_600_000 }))
  const preWorkout = candidates.filter(item => item.hours <= 0 && item.hours >= -3).sort((a, b) => b.hours - a.hours)[0]?.meal ?? null
  const postWorkout = candidates.filter(item => item.hours >= 0 && item.hours <= 2).sort((a, b) => a.hours - b.hours)[0]?.meal ?? null
  return Object.freeze({ preWorkout, postWorkout, carbsWellTimed: Boolean(preWorkout && preWorkout.carbs >= 25), recoveryWindowMet: Boolean(postWorkout && postWorkout.protein >= 20) })
}
