const round = value => Math.round((Number(value) || 0) * 10) / 10

export function calculateEnergyBalance({ caloriesIn = 0, basalCalories = 0, activeCalories = 0, thermicEffect, history = [], currentWeightKg } = {}) {
  const intake = Math.max(0, Number(caloriesIn) || 0)
  const thermic = thermicEffect == null ? intake * .1 : Math.max(0, Number(thermicEffect) || 0)
  const caloriesOut = Math.max(0, Number(basalCalories) || 0) + Math.max(0, Number(activeCalories) || 0) + thermic
  const predictedBalance = intake - caloriesOut
  const balances = [...history.map(item => Number(item.predictedBalance ?? item.balance)).filter(Number.isFinite), predictedBalance]
  const recent = balances.slice(-7)
  const weeklyTrend = recent.reduce((sum, balance) => sum + balance, 0)
  const weightChangeKg = weeklyTrend / 7700
  return Object.freeze({ caloriesIn: round(intake), caloriesOut: round(caloriesOut), predictedBalance: round(predictedBalance), weeklyTrend: round(weeklyTrend), projectedWeeklyWeightChangeKg: round(weightChangeKg), bodyWeightForecastKg: Number.isFinite(Number(currentWeightKg)) ? round(Number(currentWeightKg) + weightChangeKg) : null })
}
