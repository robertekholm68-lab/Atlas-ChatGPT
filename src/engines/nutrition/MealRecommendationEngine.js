import { rankRecipes } from './RecipeEngine.js'

const round = value => Math.max(0, Math.round(value))

export function calculateMacroAdjustment({ macros = {}, targets = {}, workout = {}, daysRemaining = 1 } = {}) {
  const duration = Math.max(0, Number(workout.durationMinutes ?? workout.duration) || 0)
  const demanding = duration >= 60 || Number(workout.trainingLoad) >= 70
  const divisor = Math.max(1, Number(daysRemaining) || 1)
  return Object.freeze({
    calories: round(((targets.calories ?? 0) - (macros.calories ?? 0)) / divisor + (demanding ? 150 : 0)),
    protein: round(((targets.protein ?? 0) - (macros.protein ?? 0)) / divisor),
    carbs: round(((targets.carbs ?? 0) - (macros.carbs ?? 0)) / divisor + (demanding ? 35 : 0)),
    fat: round(((targets.fat ?? 0) - (macros.fat ?? 0)) / divisor),
    reason: demanding ? 'training_demand' : 'daily_target',
  })
}

export function recommendMeals({ recipes = [], preferences = {}, macros = {}, targets = {}, workout = null, limit = 3 } = {}) {
  const adjustment = calculateMacroAdjustment({ macros, targets, workout: workout ?? {} })
  const ranked = rankRecipes(recipes, { ...preferences, minProtein: Math.min(adjustment.protein, 40) })
  return Object.freeze(ranked.slice(0, Math.max(0, limit)).map(({ recipe, score }) => Object.freeze({
    recipe, score, purpose: workout?.completedAt ? 'post_workout' : workout?.scheduledAt ? 'pre_workout' : 'daily_target', adjustment,
  })))
}

export function buildRecoveryNutrition({ workout = {}, hydration = {}, targets = {}, macros = {} } = {}) {
  workout = workout ?? {}
  const adjustment = calculateMacroAdjustment({ workout, targets, macros })
  const duration = Math.max(0, Number(workout.durationMinutes ?? workout.duration) || 0)
  const sweatLoss = Math.max(0, Number(workout.sweatLossMl) || duration * 8)
  const waterRemaining = Math.max(0, Number(hydration.target ?? targets.water ?? 2500) - Number(hydration.effectiveWater ?? 0))
  return Object.freeze({
    preWorkout: Object.freeze({ carbs: Math.max(25, Math.min(75, adjustment.carbs)), protein: Math.max(10, Math.min(25, adjustment.protein)), timingMinutes: 90 }),
    postWorkout: Object.freeze({ protein: Math.max(25, Math.min(45, adjustment.protein)), carbs: Math.max(30, Math.min(100, adjustment.carbs)), timingMinutes: 120 }),
    hydration: Object.freeze({ waterMl: round(Math.max(waterRemaining, sweatLoss * 1.25)), strategy: 'Sip before training and replace estimated sweat loss after training.' }),
    electrolytes: Object.freeze({ recommended: duration >= 60 || sweatLoss >= 750, sodiumMg: duration >= 60 ? round(sweatLoss * .7) : 0 }),
  })
}
