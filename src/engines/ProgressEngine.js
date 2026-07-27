const DAY = 86_400_000
const resultCache = new WeakMap()

const number = value => Number.isFinite(Number(value)) ? Number(value) : 0
const round = (value, precision = 1) => Number(number(value).toFixed(precision))
const exerciseId = exercise => String(exercise?.exerciseId || exercise?.id || '')
const workoutDate = workout => workout?.completedAt || workout?.date || null
const validDate = value => {
  if (value == null || value === '') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
const completedSets = exercise => (exercise?.sets || []).filter(set => set && set.done !== false)
const estimateOneRepMax = (weight, reps) => weight > 0 && reps > 0 ? weight * (1 + reps / 30) : 0
const setVolume = set => number(set?.kg ?? set?.weight) * number(set?.reps)
const keyForPeriod = (date, period) => period === 'month'
  ? date.toISOString().slice(0, 7)
  : (() => { const value = new Date(date); value.setUTCHours(0, 0, 0, 0); value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7)); return value.toISOString().slice(0, 10) })()

function flatten(workouts, dnaById) {
  const rows = []
  for (const workout of workouts) {
    const date = validDate(workoutDate(workout))
    if (!date) continue
    for (const logged of workout?.exercises || []) {
      const id = exerciseId(logged)
      const definition = dnaById.get(id) || {}
      const sets = completedSets(logged)
      if (!id || !sets.length) continue
      rows.push({ workout, date, id, exercise: { ...definition, ...logged }, sets })
    }
  }
  return rows
}

function metricsForRows(rows) {
  const records = new Map()
  for (const row of rows) {
    const record = records.get(row.id) || { exerciseId: row.id, exerciseName: row.exercise.name || row.id, bestWeight: 0, bestReps: 0, bestEstimated1RM: 0, bestTotalVolume: 0, bestSessionVolume: 0, bestSet: null, sessions: 0, repCounts: {}, equipmentCounts: {}, volumeHistory: [], lastWeight: 0 }
    const sessionVolume = row.sets.reduce((sum, set) => sum + setVolume(set), 0)
    let sessionWeight = 0
    record.sessions += 1
    record.bestTotalVolume += sessionVolume
    record.bestSessionVolume = Math.max(record.bestSessionVolume, sessionVolume)
    record.volumeHistory.push({ date: row.date.toISOString(), volume: round(sessionVolume, 0) })
    const equipment = row.exercise.equipment || row.exercise.exerciseDna?.equipmentCategory
    if (equipment) record.equipmentCounts[equipment] = (record.equipmentCounts[equipment] || 0) + 1
    for (const set of row.sets) {
      const weight = number(set.kg ?? set.weight); const reps = number(set.reps); const estimated1RM = estimateOneRepMax(weight, reps)
      sessionWeight = Math.max(sessionWeight, weight)
      record.bestWeight = Math.max(record.bestWeight, weight)
      record.bestReps = Math.max(record.bestReps, reps)
      record.bestEstimated1RM = Math.max(record.bestEstimated1RM, estimated1RM)
      record.repCounts[reps] = (record.repCounts[reps] || 0) + 1
      if (!record.bestSet || setVolume(set) > record.bestSet.volume || (setVolume(set) === record.bestSet.volume && weight > record.bestSet.weight)) record.bestSet = { weight, reps, volume: setVolume(set), estimated1RM: round(estimated1RM) }
    }
    record.lastWeight = sessionWeight
    records.set(row.id, record)
  }
  return records
}

function publicRecord(record) {
  const favorite = entries => Object.entries(entries).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))[0]?.[0] || null
  return { exerciseId: record.exerciseId, exerciseName: record.exerciseName, bestWeight: record.bestWeight, bestReps: record.bestReps, bestEstimated1RM: round(record.bestEstimated1RM), bestTotalVolume: round(record.bestTotalVolume, 0), bestSessionVolume: round(record.bestSessionVolume, 0), bestSet: record.bestSet, lastWeight: record.lastWeight, frequency: record.sessions, favoriteRepRange: favorite(record.repCounts), favoriteEquipment: favorite(record.equipmentCounts), volumeHistory: record.volumeHistory }
}

/** Detects direction from two equally sized chronological windows. */
export function detectTrend(values = [], options = {}) {
  const clean = values.map(number).filter(Number.isFinite)
  const windowSize = Math.max(1, Math.floor(clean.length / 2))
  if (clean.length < 2) return { direction: 'stable', confidence: 0, changePercentage: 0, samples: clean.length }
  const previous = clean.slice(-windowSize * 2, -windowSize)
  const recent = clean.slice(-windowSize)
  const average = valuesToAverage => valuesToAverage.reduce((sum, value) => sum + value, 0) / valuesToAverage.length
  const before = average(previous); const after = average(recent)
  const changePercentage = before ? ((after - before) / Math.abs(before)) * 100 : after ? 100 : 0
  const threshold = number(options.threshold) || 5
  return { direction: changePercentage > threshold ? 'improving' : changePercentage < -threshold ? 'declining' : 'stable', confidence: Math.min(100, Math.round(clean.length / Math.max(4, number(options.targetSamples) || 8) * 100)), changePercentage: round(changePercentage), samples: clean.length }
}

function consistency(workouts, rows, now) {
  const sessions = workouts.map(workout => ({ workout, date: validDate(workoutDate(workout)) })).filter(item => item.date).sort((a, b) => a.date - b.date)
  const days = [...new Set(sessions.map(item => item.date.toISOString().slice(0, 10)))]
  let longestStreak = 0; let running = 0
  days.forEach((day, index) => { running = index && (new Date(day) - new Date(days[index - 1])) / DAY === 1 ? running + 1 : 1; longestStreak = Math.max(longestStreak, running) })
  const weeks = new Set(sessions.map(item => keyForPeriod(item.date, 'week')))
  const months = new Set(sessions.map(item => keyForPeriod(item.date, 'month')))
  const consecutivePeriods = (keys, unitDays) => { const sorted = [...keys].sort(); let best = 0; let current = 0; sorted.forEach((key, index) => { const gap = index ? (new Date(key) - new Date(sorted[index - 1])) / DAY : 0; current = !index || (unitDays === 7 ? gap === 7 : gap >= 28 && gap <= 31) ? current + 1 : 1; best = Math.max(best, current) }); return best }
  const spanWeeks = sessions.length ? Math.max(1, Math.ceil((now - sessions[0].date) / (7 * DAY))) : 0
  const expectedSessions = spanWeeks ? Math.round(sessions.length / spanWeeks) : 0
  const missedSessions = spanWeeks ? Math.max(0, spanWeeks * expectedSessions - sessions.length) : 0
  const weekdayCounts = sessions.reduce((counts, item) => { const key = item.date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }); counts[key] = (counts[key] || 0) + 1; return counts }, {})
  const muscleCounts = {}
  rows.forEach(row => [...new Set([...(row.exercise.primary || row.exercise.primaryMuscles || []), ...(row.exercise.secondary || row.exercise.secondaryMuscles || [])])].forEach(muscle => { muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1 }))
  const top = counts => Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null
  return { weeklyStreak: consecutivePeriods(weeks, 7), monthlyStreak: consecutivePeriods(months, 30), missedSessions, averageWeeklySessions: spanWeeks ? round(sessions.length / spanWeeks) : 0, averageWorkoutDuration: sessions.length ? round(sessions.reduce((sum, item) => sum + number(item.workout.duration), 0) / sessions.length) : 0, mostTrainedWeekday: top(weekdayCounts), mostTrainedMuscle: top(muscleCounts), longestStreak, trainingFrequency: sessions.length }
}

function periodRecords(workouts, period) {
  const buckets = {}
  workouts.forEach(workout => { const date = validDate(workoutDate(workout)); if (!date) return; const key = keyForPeriod(date, period); const volume = number(workout.volume) || (workout.exercises || []).flatMap(exercise => completedSets(exercise)).reduce((sum, set) => sum + setVolume(set), 0); buckets[key] = (buckets[key] || 0) + volume })
  const series = Object.entries(buckets).sort(([left], [right]) => left.localeCompare(right)).map(([periodKey, volume]) => ({ period: periodKey, volume: round(volume, 0) }))
  const best = [...series].sort((a, b) => b.volume - a.volume || a.period.localeCompare(b.period))[0] || null
  return { series, best }
}

function periodFrequencies(workouts) {
  const counts = {}
  workouts.forEach(workout => { const date = validDate(workoutDate(workout)); if (!date) return; const key = keyForPeriod(date, 'week'); counts[key] = (counts[key] || 0) + 1 })
  return Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)).map(([, count]) => count)
}

/** Pure progress intelligence. Current workout is compared with history, never with itself. */
export function calculateProgress(workoutHistory = [], currentWorkout = null, exerciseDNA = [], muscleHistory = {}, options = {}) {
  const history = Array.isArray(workoutHistory) ? workoutHistory : []
  const dna = Array.isArray(exerciseDNA) ? exerciseDNA : []
  const now = validDate(options.now) || validDate(currentWorkout && workoutDate(currentWorkout)) || new Date()
  const dnaById = new Map(dna.map(exercise => [String(exercise.id), exercise]))
  const historicalRows = flatten(history, dnaById)
  const currentRows = flatten(currentWorkout ? [currentWorkout] : [], dnaById)
  const historical = metricsForRows(historicalRows); const current = metricsForRows(currentRows)
  const personalRecords = [...new Set([...historical.keys(), ...current.keys()])].map(id => publicRecord(current.has(id) ? mergeRecord(historical.get(id), current.get(id)) : historical.get(id)))
  const prs = []
  current.forEach((value, id) => {
    const prior = historical.get(id)
    const checks = [['weight','bestWeight'], ['reps','bestReps'], ['volume','bestSessionVolume'], ['estimated1RM','bestEstimated1RM']]
    checks.forEach(([type, field]) => { if (value[field] > number(prior?.[field])) prs.push({ type, exerciseId: id, exerciseName: value.exerciseName, value: round(value[field]), previous: round(prior?.[field]), isFirstRecord: !prior }) })
  })
  const allWorkouts = currentWorkout ? [...history, currentWorkout] : history
  const allRows = [...historicalRows, ...currentRows]
  const weekly = periodRecords(allWorkouts, 'week'); const monthly = periodRecords(allWorkouts, 'month')
  const frequencySeries = periodFrequencies(allWorkouts)
  const strengthSeries = allRows.map(row => Math.max(...row.sets.map(set => estimateOneRepMax(number(set.kg ?? set.weight), number(set.reps))), 0))
  const recoverySeries = Array.isArray(options.recoveryHistory) ? options.recoveryHistory.map(item => number(item.score ?? item)) : []
  const consistencyResult = consistency(allWorkouts, allRows, now)
  const muscleProgress = Object.entries(muscleHistory || {}).map(([muscleId, value]) => ({ muscleId, consistencyScore: number(value.consistencyScore ?? value.trainingFrequency), progressTrend: value.trend || detectTrend(value.strengthHistory || []), volumeTrend: value.volumeTrend || value.trend || detectTrend(value.volumeHistory || []), strengthTrend: value.strengthTrend || detectTrend(value.strengthHistory || []), recentPRs: prs.filter(pr => (value.exerciseIds || []).includes(pr.exerciseId)), bestExercise: value.favoriteExercise?.bestPerforming || value.bestExercise || null, weakestExercise: value.weakestExercise || null }))
  const healthSnapshots = Array.isArray(options.healthSnapshots) ? options.healthSnapshots : []
  const healthIntelligence = options.healthIntelligence || {}
  const healthProgress = {
    weight: detectTrend(healthSnapshots.map(item => item.bodyWeight).filter(value => value != null)),
    bodyFat: detectTrend(healthSnapshots.map(item => item.bodyFat).filter(value => value != null)),
    healthScore: healthIntelligence.healthScore ?? null,
    readinessTrend: healthIntelligence.trends?.periods?.['7Day'] ?? null,
  }
  return { generatedAt: now.toISOString(), records: { weightPRs: prs.filter(pr => pr.type === 'weight'), repPRs: prs.filter(pr => pr.type === 'reps'), volumePRs: prs.filter(pr => pr.type === 'volume'), estimated1RMPRs: prs.filter(pr => pr.type === 'estimated1RM'), weeklyVolumeRecord: weekly.best, monthlyVolumeRecord: monthly.best, personalRecords }, prs, consistency: consistencyResult, trends: { volume: detectTrend(weekly.series.map(item => item.volume)), strength: detectTrend(strengthSeries), consistency: detectTrend(frequencySeries), recovery: detectTrend(recoverySeries), frequency: detectTrend(frequencySeries) }, history: { weekly: weekly.series, monthly: monthly.series }, muscles: muscleProgress, health: healthProgress }
}

function mergeRecord(historical, current) {
  if (!historical) return current
  return { ...historical, bestWeight: Math.max(historical.bestWeight, current.bestWeight), bestReps: Math.max(historical.bestReps, current.bestReps), bestEstimated1RM: Math.max(historical.bestEstimated1RM, current.bestEstimated1RM), bestTotalVolume: historical.bestTotalVolume + current.bestTotalVolume, bestSessionVolume: Math.max(historical.bestSessionVolume, current.bestSessionVolume), bestSet: !historical.bestSet || current.bestSet?.volume > historical.bestSet.volume ? current.bestSet : historical.bestSet, sessions: historical.sessions + current.sessions, repCounts: mergeCounts(historical.repCounts, current.repCounts), equipmentCounts: mergeCounts(historical.equipmentCounts, current.equipmentCounts), volumeHistory: [...historical.volumeHistory, ...current.volumeHistory], lastWeight: current.lastWeight }
}
const mergeCounts = (left = {}, right = {}) => Object.fromEntries([...new Set([...Object.keys(left), ...Object.keys(right)])].map(key => [key, number(left[key]) + number(right[key])]))

/** Memoized entry point. Cache is scoped by history identity so rendering does not recompute unchanged history. */
export function getProgressIntelligence(workoutHistory = [], currentWorkout = null, exerciseDNA = [], muscleHistory = {}, options = {}) {
  if (!workoutHistory || typeof workoutHistory !== 'object') return calculateProgress(workoutHistory, currentWorkout, exerciseDNA, muscleHistory, options)
  const cached = resultCache.get(workoutHistory)
  const key = `${currentWorkout ? workoutDate(currentWorkout) || currentWorkout.id : ''}|${options.now || ''}|${exerciseDNA.length}|${Object.keys(muscleHistory || {}).length}`
  if (cached?.key === key && cached.currentWorkout === currentWorkout && cached.exerciseDNA === exerciseDNA && cached.muscleHistory === muscleHistory) return cached.result
  const result = calculateProgress(workoutHistory, currentWorkout, exerciseDNA, muscleHistory, options)
  resultCache.set(workoutHistory, { key, currentWorkout, exerciseDNA, muscleHistory, result })
  return result
}

export default getProgressIntelligence
