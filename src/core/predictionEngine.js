const DAY_MS = 24 * 60 * 60 * 1000

export const PREDICTION_THRESHOLDS = {
  metricTrend: 4,
  workoutTrend: 6,
  goalTimeline: 4,
  performanceTrend: 4,
  plateau: 6,
  consistency: 6,
  recoveryRisk: 2
}

const METRIC_FIELDS = [
  { key: 'weight', aliases: ['weight', 'bodyWeight', 'body_weight'], label: 'body weight', unit: 'kg', category: 'body' },
  { key: 'bodyFat', aliases: ['bodyFat', 'bodyFatPercentage', 'body_fat', 'bodyfat'], label: 'body-fat percentage', unit: '%' , category: 'body' },
  { key: 'waist', aliases: ['waist', 'waistMeasurement', 'waistCm'], label: 'waist measurement', unit: 'cm', category: 'body' }
]

function clone(value) { return JSON.parse(JSON.stringify(value ?? null)) }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)) }
function round(value, decimals = 1) { const factor = 10 ** decimals; return Math.round(value * factor) / factor }
function iso(now) { return new Date(now).toISOString() }
function addDays(now, days) { return new Date(now + days * DAY_MS).toISOString() }
function timeOf(item) {
  const value = item?.completedAt || item?.createdAt || item?.updatedAt || item?.date
  if (!value) return 0
  const parsed = new Date(String(value).includes('T') ? value : `${value}T12:00:00`).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}
function confidenceLabel(confidence) {
  if (confidence >= 0.75) return 'high'
  if (confidence >= 0.5) return 'medium'
  if (confidence > 0) return 'low'
  return 'insufficient'
}
function trendLabel(rate, epsilon = 0.03) {
  if (rate > epsilon) return 'improving'
  if (rate < -epsilon) return 'declining'
  return 'stable'
}
function insufficient(id, type, category, title, needed, found, now) {
  return { id, type, category, title, description: `Insufficient local data: ${needed} observations are needed and ${found} were found.`, currentValue: null, predictedValue: null, unit: null, targetDate: null, horizonDays: 0, confidence: 0, confidenceLabel: 'insufficient', trend: 'unknown', assumptions: ['No projection is made when local history is too limited.'], evidence: [`Minimum observations: ${needed}`, `Available observations: ${found}`], recommendation: 'Keep logging data so ASKR can estimate this cautiously later.', status: 'insufficient-data', createdAt: iso(now) }
}
function weightedRate(points, maxDailyRate) {
  const sorted = [...points].sort((a, b) => a.t - b.t)
  const segments = []
  for (let i = 1; i < sorted.length; i += 1) {
    const days = Math.max(1, (sorted[i].t - sorted[i - 1].t) / DAY_MS)
    segments.push({ rate: (sorted[i].value - sorted[i - 1].value) / days, weight: i })
  }
  const weight = segments.reduce((sum, item) => sum + item.weight, 0) || 1
  const raw = segments.reduce((sum, item) => sum + item.rate * item.weight, 0) / weight
  return clamp(raw, -maxDailyRate, maxDailyRate)
}
function volatility(points, rate) {
  if (points.length < 3) return 0
  const sorted = [...points].sort((a, b) => a.t - b.t)
  const diffs = []
  for (let i = 1; i < sorted.length; i += 1) diffs.push(((sorted[i].value - sorted[i - 1].value) / Math.max(1, (sorted[i].t - sorted[i - 1].t) / DAY_MS)) - rate)
  return Math.sqrt(diffs.reduce((sum, value) => sum + value * value, 0) / diffs.length)
}
function confidence(points, rate, horizonDays, now) {
  const sample = clamp(points.length / 10, 0.25, 1)
  const lastAge = Math.max(0, (now - Math.max(...points.map(p => p.t))) / DAY_MS)
  const stale = clamp(1 - lastAge / 45, 0.25, 1)
  const vol = volatility(points, rate)
  const volatile = clamp(1 - (Math.abs(rate) ? vol / (Math.abs(rate) * 3 + 0.01) : vol), 0.25, 1)
  const horizon = clamp(1 - Math.max(0, horizonDays - 28) / 120, 0.35, 1)
  return round(clamp(sample * stale * volatile * horizon, 0.05, 0.95), 2)
}
function metricPoints(state, field) {
  const sources = [state.profile, ...(state.profile?.measurements || []), ...(state.measurements || []), ...(state.bodyMeasurements || [])]
  return sources.flatMap(item => {
    if (!item) return []
    const alias = field.aliases.find(name => Number.isFinite(Number(item[name])))
    const t = timeOf(item)
    return alias && t ? [{ t, value: Number(item[alias]) }] : []
  }).sort((a, b) => a.t - b.t)
}
function workoutWeeks(workouts, now, weeks = 8) {
  return Array.from({ length: weeks }, (_, index) => {
    const end = now - (weeks - index - 1) * 7 * DAY_MS
    const start = end - 7 * DAY_MS
    return (workouts || []).filter(w => timeOf(w) >= start && timeOf(w) < end).length
  })
}
function prediction(base, now) {
  return { status: 'active', createdAt: iso(now), ...base, confidenceLabel: confidenceLabel(base.confidence) }
}

export function comparePredictionScenarios(state = {}, scenarios = [], now = Date.now()) {
  const weeks = workoutWeeks(state.workouts || [], now, 4)
  const currentWeekly = weeks.reduce((a, b) => a + b, 0) / 4
  return scenarios.map((scenario, index) => {
    const weekly = Math.max(0, currentWeekly + Number(scenario.weeklyWorkoutDelta || 0))
    const completion = clamp(Number(scenario.completionRate ?? 1), 0, 1)
    return { id: scenario.id || `scenario-${index + 1}`, title: scenario.title || `Scenario ${index + 1}`, weeklyWorkouts: round(weekly, 1), projectedWorkouts28Days: round(weekly * 4 * completion, 1), assumptions: ['Deterministic comparison based on recent four-week frequency.', 'This is not a guarantee of future adherence.'], createdAt: iso(now) }
  })
}

export function generateAtlasPredictions(state = {}, now = Date.now(), options = {}) {
  const items = []
  const workouts = [...(state.workouts || [])].sort((a, b) => timeOf(a) - timeOf(b))

  for (const field of METRIC_FIELDS) {
    const points = metricPoints(state, field)
    if (points.length >= PREDICTION_THRESHOLDS.metricTrend) {
      const horizonDays = 28, rate = weightedRate(points, field.key === 'bodyFat' ? 0.15 : field.key === 'weight' ? 0.25 : 0.2)
      const currentValue = points.at(-1).value, predictedValue = round(currentValue + rate * horizonDays, 1)
      const conf = confidence(points, rate, horizonDays, now)
      items.push(prediction({ id: `trend-${field.key}`, type: 'trend-projection', category: field.category, title: `Estimated ${field.label} trend`, description: `Based on your recent data, ${field.label} is likely ${trendLabel(rate)} over the next four weeks.`, currentValue, predictedValue, unit: field.unit, targetDate: addDays(now, horizonDays), horizonDays, confidence: conf, trend: trendLabel(rate), assumptions: ['Recent observations are more important than older observations.', 'Daily rates are capped to avoid unrealistic projections.'], evidence: [`${points.length} local observations`, `Weighted rate: ${round(rate, 3)} ${field.unit}/day`], recommendation: 'Use this as a cautious estimate and keep logging consistent measurements.' }, now))
    } else if (options.includeInsufficient) items.push(insufficient(`trend-${field.key}`, 'trend-projection', field.category, `Estimated ${field.label} trend`, PREDICTION_THRESHOLDS.metricTrend, points.length, now))
  }

  if (workouts.length >= PREDICTION_THRESHOLDS.workoutTrend) {
    const weeks = workoutWeeks(workouts, now, 8)
    const points = weeks.map((value, index) => ({ t: now - (weeks.length - index) * 7 * DAY_MS, value }))
    const rate = weightedRate(points, 0.2), currentValue = round(weeks.slice(-4).reduce((a, b) => a + b, 0) / 4, 1)
    items.push(prediction({ id: 'trend-training-frequency', type: 'trend-projection', category: 'training', title: 'Estimated training-frequency trend', description: `Based on your recent data, weekly training frequency is likely ${trendLabel(rate)}.`, currentValue, predictedValue: round(clamp(currentValue + rate * 28, 0, 14), 1), unit: 'workouts/week', targetDate: addDays(now, 28), horizonDays: 28, confidence: confidence(points, rate, 28, now), trend: trendLabel(rate), assumptions: ['Frequency is calculated from completed workout timestamps.'], evidence: [`${workouts.length} workouts logged`, `Recent weekly counts: ${weeks.join(', ')}`], recommendation: 'Plan the next week before adding volume.' }, now))

    const missed = weeks.slice(-4).filter(v => v < Math.max(1, currentValue - 1)).length
    items.push(prediction({ id: 'consistency-forecast', type: 'consistency-forecast', category: 'training', title: 'Estimated consistency forecast', description: `You are likely to maintain about ${currentValue} workouts per week if recent conditions stay similar.`, currentValue, predictedValue: round(currentValue * 4, 1), unit: 'workouts/28 days', targetDate: addDays(now, 28), horizonDays: 28, confidence: round(clamp((workouts.length / 14) * (1 - missed * 0.12), 0.15, 0.85), 2), trend: missed ? 'variable' : 'stable', assumptions: ['Future schedule resembles the last four weeks.'], evidence: [`Missed/low weeks in last four: ${missed}`], recommendation: missed ? 'Keep a fallback shorter session ready.' : 'Maintain the current weekly rhythm.' }, now))
  }

  const last4 = workoutWeeks(workouts, now, 4).reduce((a, b) => a + b, 0)
  const previous4 = workoutWeeks(workouts, now - 28 * DAY_MS, 4).reduce((a, b) => a + b, 0)
  if (workouts.length >= PREDICTION_THRESHOLDS.plateau && last4 >= 2 && last4 >= previous4 * 0.7) {
    const prs = state.memory?.personalRecords || []
    if (prs.length < 1 || (state.memory?.exercises || []).every(e => Number(e.latestWeight || 0) <= Number(e.bestWeight || 0))) items.push(prediction({ id: 'plateau-training-progress', type: 'plateau-risk', category: 'progress', title: 'Possible plateau risk', description: 'Progress appears estimated as flat despite continued activity based on your recent local data.', currentValue: last4, predictedValue: last4, unit: 'workouts/28 days', targetDate: addDays(now, 14), horizonDays: 14, confidence: round(clamp(workouts.length / 14, 0.25, 0.75), 2), trend: 'flat', assumptions: ['Plateau risk is a training signal, not a diagnosis.'], evidence: [`Last 4 weeks: ${last4} workouts`, `Previous 4 weeks: ${previous4} workouts`], recommendation: 'Review exercise selection, load progression and recovery before adding more intensity.' }, now))
  }

  if (state.recovery && (workouts.filter(w => now - timeOf(w) <= 7 * DAY_MS).length >= PREDICTION_THRESHOLDS.recoveryRisk || Number(state.recovery.score) < 60)) {
    const score = Number(state.recovery.score ?? 100)
    const fatigued = Object.entries(state.recovery.muscles || {}).filter(([, v]) => Number(v?.fatigue || 0) >= 65).map(([name]) => name)
    if (score < 70 || fatigued.length) items.push(prediction({ id: 'recovery-short-term-risk', type: 'recovery-risk', category: 'recovery', title: 'Possible short-term recovery risk', description: 'Based on recent training load and muscle recovery, recovery may be limited in the next few days.', currentValue: score, predictedValue: Math.max(0, score - fatigued.length * 3), unit: 'recovery score', targetDate: addDays(now, 3), horizonDays: 3, confidence: round(clamp((100 - score) / 60 + fatigued.length * 0.08, 0.25, 0.8), 2), trend: score < 60 ? 'declining' : 'stable', assumptions: ['This is not medical advice or a diagnosis.'], evidence: [`Recovery score: ${score}`, `Fatigued muscles: ${fatigued.join(', ') || 'none'}`], recommendation: 'Consider lower volume or an easier session until recovery improves.' }, now))
  }

  for (const goal of state.goals || []) {
    const targetNum = Number(String(goal.target || '').match(/-?\d+(\.\d+)?/)?.[0])
    const goalText = `${goal.title || ''} ${goal.target || ''}`.toLowerCase()
    const field = METRIC_FIELDS.find(f => goalText.includes(f.label.split(' ')[0]) || goalText.includes(f.key.toLowerCase()) || f.aliases.some(alias => goalText.includes(String(alias).toLowerCase())) || (f.key === 'weight' && goalText.includes('kg')))
    const points = field ? metricPoints(state, field) : []
    if (field && Number.isFinite(targetNum) && points.length >= PREDICTION_THRESHOLDS.goalTimeline) {
      const rate = weightedRate(points, field.key === 'bodyFat' ? 0.15 : 0.25)
      const currentValue = points.at(-1).value, distance = targetNum - currentValue
      if (Math.sign(distance) === Math.sign(rate) && Math.abs(rate) > 0.005) {
        const horizonDays = Math.ceil(clamp(Math.abs(distance / rate), 7, 365))
        items.push(prediction({ id: `goal-timeline-${goal.id}`, type: 'goal-timeline', category: 'goal', title: `Estimated timeline for ${goal.title}`, description: 'Based on your recent data, this goal may be reached around the estimated date if the trend continues.', currentValue, predictedValue: targetNum, unit: field.unit, targetDate: addDays(now, horizonDays), horizonDays, confidence: confidence(points, rate, horizonDays, now), trend: trendLabel(rate), assumptions: ['The recent trend continues without major behavior changes.', 'Projection is capped at one year.'], evidence: [`Current: ${currentValue}${field.unit}`, `Target: ${targetNum}${field.unit}`], recommendation: 'Treat the date as a planning estimate, not a promise.' }, now))
      }
    }
  }

  const unique = [...new Map(items.map(item => [item.id, item])).values()]
    .sort((a, b) => (b.status === 'active') - (a.status === 'active') || b.confidence - a.confidence)
    .slice(0, 12)
  return { generatedAt: iso(now), items: unique, scenarios: comparePredictionScenarios(state, [{ id: 'current', title: 'Current behavior' }, { id: 'plus-one', title: 'One additional workout/week', weeklyWorkoutDelta: 1 }, { id: 'minus-one', title: 'One missed workout/week', weeklyWorkoutDelta: -1 }], now) }
}

export function refreshAtlasPredictions(state, now = Date.now()) {
  return { ...state, predictions: generateAtlasPredictions(state, now) }
}
