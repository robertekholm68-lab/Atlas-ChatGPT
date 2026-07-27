import { calculateHealthScore } from './HealthScoreEngine.js'
import { calculateHealthTrends } from './HealthTrendEngine.js'
import { calculateReadiness } from './ReadinessEngine.js'
import { deepFreeze } from './HealthModels.js'

const cache = new WeakMap()

export function buildHealthIntelligence(snapshots = [], context = {}) {
  const ordered = [...snapshots].sort((left, right) => String(left.timestamp).localeCompare(String(right.timestamp)))
  const latest = ordered.at(-1) ?? null
  const healthScore = calculateHealthScore(latest || {}, context.scoreOptions)
  return deepFreeze({ latest, healthScore, readiness: calculateReadiness({ ...context, snapshot: latest, healthScore }), trends: calculateHealthTrends(ordered, { now: context.now, metrics: context.metrics }) })
}

/** Memoized selector for React/view-model callers using stable snapshot arrays. */
export function getHealthIntelligence(snapshots = [], context = {}) {
  if (!snapshots || typeof snapshots !== 'object') return buildHealthIntelligence(snapshots, context)
  const cached = cache.get(snapshots)
  if (cached?.context === context) return cached.result
  const result = buildHealthIntelligence(snapshots, context)
  cache.set(snapshots, { context, result })
  return result
}
