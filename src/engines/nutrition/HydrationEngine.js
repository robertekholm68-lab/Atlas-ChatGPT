export const HYDRATION_FACTORS = Object.freeze({ water: 1, coffee: .8, tea: .9, sports_drink: .95 })

export function calculateHydration(entries = [], target = 2500) {
  const byType = {}
  let effectiveWater = 0
  for (const entry of entries) { const amount = Math.max(0, Number(entry.amount) || 0); byType[entry.type] = (byType[entry.type] || 0) + amount; effectiveWater += amount * (HYDRATION_FACTORS[entry.type] ?? .8) }
  const score = Math.min(100, Math.round(effectiveWater / Math.max(1, target) * 100))
  return Object.freeze({ total: Object.values(byType).reduce((sum, value) => sum + value, 0), effectiveWater: Math.round(effectiveWater), target, byType: Object.freeze(byType), score, status: score >= 90 ? 'optimal' : score >= 70 ? 'improving' : 'low' })
}
