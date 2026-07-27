export function selectNextBestAction(briefing, context) {
  return briefing.topActions.find(action => {
    const duration = Number(action.payload.duration || context.currentWorkoutPlan.duration || 0)
    return !duration || duration <= context.availableTime
  }) || briefing.topActions[0] || null
}

export function selectDailyBriefing(decisions, context, explanations) {
  const primary = decisions[0]
  const byDomain = domain => decisions.find(decision => decision.category === domain)?.summary || null
  return Object.freeze({
    overallStatus: primary?.safetyLevel === 'caution' ? 'caution' : primary ? 'ready' : 'check_in_needed', primaryFocus: primary?.title || 'Complete a check-in',
    readiness: context.recoveryStatus.readiness ?? null, recommendedWorkout: decisions.find(item => item.category === 'training')?.recommendedAction || null,
    nutritionFocus: byDomain('nutrition'), recoveryFocus: byDomain('recovery'), progressFocus: byDomain('progress'),
    warnings: decisions.filter(item => item.safetyLevel !== 'normal').map(item => item.summary).slice(0, 1),
    topActions: decisions.map(item => item.recommendedAction).slice(0, 3), explanation: explanations[primary?.id]?.standard || 'Add more data for a tailored recommendation.', confidence: primary?.confidence || null,
  })
}
