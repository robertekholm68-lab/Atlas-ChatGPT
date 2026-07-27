const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const text = value => String(value ?? '').trim().toLowerCase()

export function createRecipe(input = {}) {
  const servings = Math.max(1, number(input.servings, 1))
  return Object.freeze({
    id: String(input.id ?? `recipe-${text(input.name).replace(/\s+/g, '-') || 'meal'}`),
    name: String(input.name ?? 'Untitled recipe'),
    calories: Math.max(0, number(input.calories)), protein: Math.max(0, number(input.protein)),
    carbs: Math.max(0, number(input.carbs)), fat: Math.max(0, number(input.fat)),
    prepTime: Math.max(0, number(input.prepTime)), cost: Math.max(0, number(input.cost)), servings,
    cuisine: text(input.cuisine), diet: Object.freeze((input.diet ?? []).map(text)),
    allergens: Object.freeze((input.allergens ?? []).map(text)),
    ingredients: Object.freeze((input.ingredients ?? []).map(item => Object.freeze({
      name: String(item.name ?? item), amount: Math.max(0, number(item.amount, 1)),
      unit: String(item.unit ?? 'item'), category: text(item.category) || 'other',
    }))),
    skill: Math.max(1, Math.min(3, number(input.skill, 1))),
    tags: Object.freeze((input.tags ?? []).map(text)),
  })
}

export function filterRecipes(recipes = [], filters = {}) {
  const diets = (filters.diet ? [filters.diet].flat() : []).map(text)
  const allergies = (filters.allergies ?? []).map(text)
  const cuisines = (filters.cuisine ? [filters.cuisine].flat() : []).map(text)
  return Object.freeze(recipes.map(createRecipe).filter(recipe =>
    (filters.minCalories == null || recipe.calories >= number(filters.minCalories)) &&
    (filters.maxCalories == null || recipe.calories <= number(filters.maxCalories)) &&
    (filters.minProtein == null || recipe.protein >= number(filters.minProtein)) &&
    (filters.maxPrepTime == null || recipe.prepTime <= number(filters.maxPrepTime)) &&
    (filters.maxBudget == null || recipe.cost <= number(filters.maxBudget)) &&
    (!cuisines.length || cuisines.includes(recipe.cuisine)) &&
    (!diets.length || diets.every(diet => recipe.diet.includes(diet))) &&
    !recipe.allergens.some(allergen => allergies.includes(allergen))
  ))
}

export function rankRecipes(recipes = [], preferences = {}) {
  const favorites = (preferences.favoriteFoods ?? []).map(text)
  const disliked = (preferences.dislikedFoods ?? []).map(text)
  return Object.freeze(filterRecipes(recipes, {
    allergies: preferences.allergies, diet: preferences.diet, maxBudget: preferences.budgetPerMeal,
    maxPrepTime: preferences.timeAvailable, minProtein: preferences.minProtein,
  }).filter(recipe => !disliked.some(food => `${recipe.name} ${recipe.ingredients.map(i => i.name).join(' ')}`.toLowerCase().includes(food)))
    .map(recipe => {
      const content = `${recipe.name} ${recipe.ingredients.map(i => i.name).join(' ')}`.toLowerCase()
      const score = recipe.protein * 1.5 - recipe.cost - recipe.prepTime * .1 + favorites.filter(food => content.includes(food)).length * 25
      return Object.freeze({ recipe, score: Math.round(score * 10) / 10 })
    }).sort((a, b) => b.score - a.score))
}
