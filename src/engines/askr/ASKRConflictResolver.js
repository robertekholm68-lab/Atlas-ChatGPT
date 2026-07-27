const RULES = [
  { winner: ['recovery', 'REDUCE_TRAINING_VOLUME'], loser: ['goals', 'INCREASE_TRAINING_VOLUME'], reason: 'Recovery protects adaptation today; progression is delayed, not discarded.', returns: 'When readiness returns to a good range.' },
  { winner: ['recovery', 'VERY_LOW_ENERGY_AVAILABILITY'], loser: ['nutrition', 'MAINTAIN_CALORIE_DEFICIT'], reason: 'Adequate energy availability takes precedence around training.', returns: 'When energy availability and recovery normalize.' },
  { winner: ['muscles', 'MUSCLE_OVERLOADED'], loser: ['training', 'HEAVY_SESSION_PLANNED'], reason: 'Local overload requires the planned session to be modified.', returns: 'When the affected muscles recover.' },
]
export function resolveConflicts(ranked) {
  const suppressed = new Set(); const resolutions = []
  for (const rule of RULES) {
    const winning = ranked.find(item => item.signal.domain === rule.winner[0] && item.signal.type === rule.winner[1])
    const losing = ranked.find(item => item.signal.domain === rule.loser[0] && item.signal.type === rule.loser[1])
    if (winning && losing) { suppressed.add(losing.signal.id); resolutions.push({ winningRecommendation: winning.signal, suppressedRecommendation: losing.signal, reason: rule.reason, mayReturn: rule.returns }) }
  }
  return { active: ranked.filter(item => !suppressed.has(item.signal.id)), suppressed: ranked.filter(item => suppressed.has(item.signal.id)), resolutions }
}
