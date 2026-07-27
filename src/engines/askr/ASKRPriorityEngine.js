import { safetyRank } from './ASKRSafetyEngine.js'

const severity = { critical: 4, high: 3, medium: 2, low: 1 }
export function priorityScore(signal, context) {
  const repeats = context.recentCoachActions.filter(action => action.signalType === signal.type).length
  const hoursOld = Math.max(0, (Date.parse(context.currentDate) - Date.parse(signal.timestamp)) / 3600000)
  const recency = Math.max(0, 1 - hoursOld / 168)
  return severity[signal.severity] * 20 + signal.goalRelevance * 14 + recency * 12 + signal.confidence * 12 + signal.potentialBenefit * 10 + signal.potentialHarm * 18 + signal.userPreference * 6 - repeats * 8
}

export function rankSignals(signals, context) {
  return signals.map(signal => ({ signal, score: priorityScore(signal, context), safetyTier: safetyRank(signal) }))
    .sort((a, b) => a.safetyTier - b.safetyTier || b.score - a.score || a.signal.id.localeCompare(b.signal.id))
}
