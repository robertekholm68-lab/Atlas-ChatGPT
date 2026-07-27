export const MEAL_TYPES = Object.freeze(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'custom'])
export const FOOD_SOURCES = Object.freeze(['manual', 'quick_log', 'favorite', 'barcode', 'recipe', 'ai_estimate', 'saved_meal'])

export const MICRONUTRIENT_TARGETS = Object.freeze({
  vitaminA: 900, vitaminB1: 1.2, vitaminB2: 1.3, vitaminB3: 16, vitaminB6: 1.7,
  vitaminB12: 2.4, vitaminC: 90, vitaminD: 20, vitaminE: 15, vitaminK: 120,
  iron: 18, calcium: 1000, magnesium: 420, zinc: 11, potassium: 3400, omega3: 1.6,
})

export const DEFAULT_NUTRITION_TARGETS = Object.freeze({
  calories: 2200, protein: 150, carbs: 250, fat: 70, fiber: 30, water: 2500,
  sugar: 50, alcohol: 0, sodium: 2300, potassium: 3400, micronutrients: MICRONUTRIENT_TARGETS,
})

const nonNegative = value => Math.max(0, Number(value) || 0)
const iso = (value, fallback) => {
  const date = new Date(value ?? fallback)
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date(fallback).toISOString()
}

export function createMeal(input = {}) {
  const eatenAt = iso(input.eatenAt, Date.now())
  return Object.freeze({
    id: String(input.id ?? `meal-${eatenAt}`), type: MEAL_TYPES.includes(input.type) ? input.type : 'custom',
    name: String(input.name ?? 'Meal'), source: FOOD_SOURCES.includes(input.source) ? input.source : 'manual', eatenAt,
    calories: nonNegative(input.calories), protein: nonNegative(input.protein), carbs: nonNegative(input.carbs),
    fat: nonNegative(input.fat), fiber: nonNegative(input.fiber), water: nonNegative(input.water),
    sugar: nonNegative(input.sugar), alcohol: nonNegative(input.alcohol), sodium: nonNegative(input.sodium),
    potassium: nonNegative(input.potassium), qualityScore: Math.min(100, nonNegative(input.qualityScore)),
    micronutrients: Object.freeze(Object.fromEntries(Object.entries(input.micronutrients ?? {}).map(([key, value]) => [key, nonNegative(value)]))),
    metadata: Object.freeze({ ...(input.metadata ?? {}) }),
  })
}

export function createNutritionDay(input = {}) {
  const date = String(input.date ?? new Date().toISOString().slice(0, 10)).slice(0, 10)
  return Object.freeze({
    id: String(input.id ?? `nutrition-${date}`), date, meals: Object.freeze((input.meals ?? []).map(createMeal)),
    hydration: Object.freeze((input.hydration ?? []).map(entry => Object.freeze({
      id: String(entry.id ?? `drink-${entry.consumedAt ?? Date.now()}`), type: String(entry.type ?? 'water'),
      amount: nonNegative(entry.amount), consumedAt: iso(entry.consumedAt, `${date}T12:00:00Z`),
    }))),
    targets: Object.freeze({ ...DEFAULT_NUTRITION_TARGETS, ...(input.targets ?? {}), micronutrients: Object.freeze({ ...MICRONUTRIENT_TARGETS, ...(input.targets?.micronutrients ?? {}) }) }),
  })
}

const baseMeal = { carbs: 190, fat: 58, fiber: 27, qualityScore: 78, potassium: 2400, micronutrients: { vitaminC: 72, vitaminD: 13, iron: 14, calcium: 760, magnesium: 310, zinc: 9, omega3: 1.2 } }
const profile = (id, overrides = {}) => createNutritionDay({ id, date: '2026-07-27', targets: overrides.targets, hydration: [{ type: 'water', amount: overrides.water ?? 2200 }], meals: [{ id: `${id}-meal`, type: 'lunch', source: 'quick_log', name: id.replaceAll('_', ' '), calories: 2100, protein: 145, ...baseMeal, ...overrides }] })

export const nutritionMockProfiles = Object.freeze({
  athlete: profile('athlete', { calories: 2800, protein: 190, carbs: 330, water: 3200, type: 'post_workout' }),
  officeWorker: profile('office_worker', { calories: 1900, protein: 115, water: 1800 }),
  fatLoss: profile('fat_loss', { calories: 1750, protein: 165, targets: { calories: 1800, protein: 160 } }),
  bulking: profile('bulking', { calories: 3100, protein: 195, targets: { calories: 3200, protein: 190 } }),
  highProtein: profile('high_protein', { protein: 210 }), lowProtein: profile('low_protein', { protein: 62 }),
  vegetarian: profile('vegetarian', { protein: 128, micronutrients: { vitaminC: 110, iron: 12, calcium: 920, magnesium: 390, zinc: 8, vitaminB12: 1.4, omega3: 1 } }),
  poorHydration: profile('poor_hydration', { water: 650 }),
})

export const NutritionDay = createNutritionDay
export const Meal = createMeal
