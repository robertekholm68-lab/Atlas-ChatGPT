const normalize = value => String(value ?? '').trim().toLowerCase()

export function createShoppingList(plan = {}) {
  const grouped = new Map()
  for (const meal of (plan.days ?? []).flatMap(day => day.meals ?? [])) {
    const multiplier = Math.max(1, Number(meal.servings) || 1) / Math.max(1, Number(meal.recipe?.servings) || 1)
    for (const ingredient of meal.recipe?.ingredients ?? []) {
      const category = normalize(ingredient.category) || 'other'
      const key = `${category}:${normalize(ingredient.name)}:${normalize(ingredient.unit)}`
      const current = grouped.get(key) ?? { name: ingredient.name, amount: 0, unit: ingredient.unit, category }
      current.amount += (Number(ingredient.amount) || 0) * multiplier
      grouped.set(key, current)
    }
  }
  const categories = {}
  for (const item of grouped.values()) {
    const entry = Object.freeze({ ...item, amount: Math.round(item.amount * 100) / 100 })
    categories[item.category] = [...(categories[item.category] ?? []), entry]
  }
  Object.keys(categories).forEach(category => { categories[category] = Object.freeze(categories[category].sort((a, b) => a.name.localeCompare(b.name))) })
  return Object.freeze({ categories: Object.freeze(categories), items: Object.freeze(Object.values(categories).flat()), generatedFromDays: plan.days?.length ?? 0 })
}
