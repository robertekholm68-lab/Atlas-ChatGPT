import { HEALTH_FIELDS, deepFreeze } from './HealthModels.js'

const DAY = 86_400_000
const lowerIsBetter = new Set(['restingHeartRate', 'stressScore'])
const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null

export function calculateMetricTrend(snapshots = [], metric, days = 7, now = snapshots.at(-1)?.timestamp ?? new Date()) {
  const end = new Date(now).getTime(); const window = days * DAY
  const values = (from, to) => snapshots.filter(item => { const time = new Date(item.timestamp).getTime(); return time > from && time <= to && Number.isFinite(Number(item[metric])) }).map(item => Number(item[metric]))
  const currentValues = values(end - window, end); const previousValues = values(end - window * 2, end - window)
  const currentAverage = average(currentValues); const previousAverage = average(previousValues)
  const changePercentage = previousAverage && currentAverage != null ? ((currentAverage - previousAverage) / Math.abs(previousAverage)) * 100 : 0
  const adjusted = lowerIsBetter.has(metric) ? -changePercentage : changePercentage
  const direction = currentValues.length && previousValues.length ? adjusted > 5 ? 'improving' : adjusted < -5 ? 'declining' : 'stable' : 'stable'
  return deepFreeze({ metric, days, direction, currentAverage, previousAverage, changePercentage: Number(changePercentage.toFixed(1)), samples: currentValues.length, sufficientData: Boolean(currentValues.length && previousValues.length) })
}

export function calculateHealthTrends(snapshots = [], options = {}) {
  const metrics = options.metrics || HEALTH_FIELDS
  const now = options.now || snapshots.at(-1)?.timestamp || new Date()
  const periods = Object.fromEntries([7, 30].map(days => [`${days}Day`, Object.fromEntries(metrics.map(metric => [metric, calculateMetricTrend(snapshots, metric, days, now)]))]))
  const directions = Object.values(periods['7Day']).filter(item => item.sufficientData).map(item => item.direction)
  const count = value => directions.filter(direction => direction === value).length
  const overall = count('improving') > count('declining') ? 'improving' : count('declining') > count('improving') ? 'declining' : 'stable'
  return deepFreeze({ periods, overall, insights: Object.values(periods['7Day']).filter(item => item.sufficientData && item.direction !== 'stable').map(item => ({ metric: item.metric, direction: item.direction, changePercentage: item.changePercentage })) })
}

