export function generateInsights(context) {
  const insights = []
  if (context.progressStatus.strengthTrend === 'improving' && context.progressStatus.weightTrend === 'stable') insights.push({ type: 'observation', text: 'Strength is improving while body weight remains stable, which supports a recomposition goal.' })
  if (context.nutritionStatus.lowCarbLegSessions >= 3) insights.push({ type: 'correlation', text: 'Lower carbohydrate intake has coincided with weaker leg sessions; this does not prove causation.' })
  if (context.recoveryStatus.bestSessionSleepHours >= 7) insights.push({ type: 'correlation', text: 'Your strongest sessions have tended to follow at least seven hours of sleep.' })
  return insights
}
