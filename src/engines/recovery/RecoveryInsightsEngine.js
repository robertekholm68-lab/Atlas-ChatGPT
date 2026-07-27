import { immutable } from './RecoveryModels.js'

export function generateRecoveryInsights(data = {}) {
  const insights = []
  if (data.sleep?.score < 55) insights.push({ type: 'sleep', message: 'Poor sleep reduced readiness.', severity: 'high' })
  if (data.stress?.trend === 'increasing') insights.push({ type: 'stress', message: 'Accumulated stress is increasing and may slow recovery.', severity: 'medium' })
  if (data.trainingLoad?.status === 'overreaching') insights.push({ type: 'load', message: 'Accumulated fatigue is increasing after a high recent workload.', severity: 'high' })
  if (data.trainingLoad?.status === 'potential_overtraining') insights.push({ type: 'load', message: 'Sustained load is exceeding the productive range; prioritize recovery.', severity: 'high' })
  if (data.hrvTrend === 'improving') insights.push({ type: 'hrv', message: 'HRV is improving, which supports a return to harder training.', severity: 'positive' })
  Object.entries(data.muscleRecovery || {}).forEach(([id, muscle]) => {
    if (muscle.recentlyOverloaded) insights.push({ type: 'muscle', muscle: id, message: `${id} remains overloaded and should not be loaded heavily yet.`, severity: 'high' })
    else if (muscle.trend === 'improving' && muscle.recoveryPercentage >= 80) insights.push({ type: 'muscle', muscle: id, message: `${id} has recovered faster than its recent trend.`, severity: 'positive' })
  })
  if (!insights.length) insights.push({ type: 'recovery', message: 'Recovery inputs are stable; normal training is appropriate.', severity: 'positive' })
  return immutable(insights)
}
