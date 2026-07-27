const DAY = 86_400_000

const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0
const dateOf = (workout, set) => set?.completedAt || workout?.completedAt || workout?.date || null
const exerciseIdOf = exercise => String(exercise?.exerciseId || exercise?.id || '')

function muscleFactor(exercise, muscleId) {
  const primary = exercise?.primary || exercise?.primaryMuscles || []
  const secondary = exercise?.secondary || exercise?.secondaryMuscles || []
  if (primary.includes(muscleId)) return finite(exercise.activationWeights?.primary?.[muscleId]) || 1
  if (secondary.includes(muscleId)) return finite(exercise.activationWeights?.secondary?.[muscleId]) || 0.5
  return 0
}

function completedSets(exercise) {
  if (!Array.isArray(exercise?.sets)) return []
  return exercise.sets.filter(set => set && set.done !== false)
}

function flattenHistory(workouts = [], exerciseLibrary = []) {
  const library = new Map(exerciseLibrary.map(exercise => [String(exercise.id), exercise]))
  const rows = []
  for (const workout of Array.isArray(workouts) ? workouts : []) {
    for (const logged of Array.isArray(workout?.exercises) ? workout.exercises : []) {
      const definition = library.get(exerciseIdOf(logged)) || {}
      const exercise = { ...definition, ...logged }
      const sets = completedSets(exercise)
      if (!sets.length) continue
      const date = dateOf(workout, sets.at(-1))
      if (!date || Number.isNaN(new Date(date).getTime())) continue
      rows.push({ workout, exercise, sets, date: new Date(date), id: exerciseIdOf(exercise), name: exercise.name || definition.name || exerciseIdOf(exercise), equipment: exercise.equipment || definition.equipment || exercise.exerciseDna?.equipmentCategory || 'Unknown' })
    }
  }
  return rows
}

const estimatedOneRepMax = (weight, reps) => weight > 0 && reps > 0 ? weight * (1 + reps / 30) : 0
const mondayKey = date => {
  const copy = new Date(date)
  copy.setUTCHours(0, 0, 0, 0)
  copy.setUTCDate(copy.getUTCDate() - ((copy.getUTCDay() + 6) % 7))
  return copy.toISOString().slice(0, 10)
}

function trendFromWeekly(weekly, now) {
  const totals = Array.from({ length: 8 }, (_, index) => {
    const week = new Date(now.getTime() - index * 7 * DAY)
    return weekly[mondayKey(week)] || 0
  })
  const recent = totals.slice(0, 4).reduce((sum, value) => sum + value, 0)
  const previous = totals.slice(4).reduce((sum, value) => sum + value, 0)
  if (!recent && !previous) return { direction: 'stable', percentage: 0 }
  if (!previous) return { direction: 'improving', percentage: 100 }
  const percentage = Math.round(((recent - previous) / previous) * 100)
  return { direction: percentage > 5 ? 'improving' : percentage < -5 ? 'declining' : 'stable', percentage }
}

/** Pure, deterministic muscle training history derived from completed workout sets. */
export function buildMuscleHistory(workouts = [], exerciseLibrary = [], muscleId, options = {}) {
  const now = new Date(options.now || Date.now())
  const cutoffWeek = now.getTime() - 7 * DAY
  const cutoffMonth = now.getTime() - 30 * DAY
  const exerciseTotals = new Map()
  const weeklyBuckets = {}
  const sessionDates = new Set()
  let weeklyVolume = 0
  let monthlyVolume = 0
  let bestWeight = 0
  let bestEstimated1RM = 0
  let bestVolume = 0
  let totalReps = 0
  let totalIntensity = 0
  let setCount = 0
  let lastTrained = null

  for (const row of flattenHistory(workouts, exerciseLibrary)) {
    const factor = muscleFactor(row.exercise, muscleId)
    if (!factor) continue
    const timestamp = row.date.getTime()
    const volume = row.sets.reduce((sum, set) => sum + finite(set.kg ?? set.weight) * finite(set.reps), 0) * factor
    const record = exerciseTotals.get(row.id) || { id: row.id, name: row.name, equipment: row.equipment, sessions: 0, sets: 0, volume: 0, bestWeight: 0, bestEstimated1RM: 0, lastTrained: null }
    record.sessions += 1
    record.sets += row.sets.length
    record.volume += volume
    record.lastTrained = !record.lastTrained || row.date > record.lastTrained ? row.date : record.lastTrained
    for (const set of row.sets) {
      const weight = finite(set.kg ?? set.weight)
      const reps = finite(set.reps)
      const oneRepMax = estimatedOneRepMax(weight, reps)
      record.bestWeight = Math.max(record.bestWeight, weight)
      record.bestEstimated1RM = Math.max(record.bestEstimated1RM, oneRepMax)
      bestWeight = Math.max(bestWeight, weight)
      bestEstimated1RM = Math.max(bestEstimated1RM, oneRepMax)
      totalReps += reps
      totalIntensity += finite(set.rpe)
      setCount += 1
    }
    exerciseTotals.set(row.id, record)
    bestVolume = Math.max(bestVolume, volume)
    weeklyBuckets[mondayKey(row.date)] = (weeklyBuckets[mondayKey(row.date)] || 0) + volume
    if (timestamp >= cutoffWeek && timestamp <= now.getTime()) weeklyVolume += volume
    if (timestamp >= cutoffMonth && timestamp <= now.getTime()) monthlyVolume += volume
    sessionDates.add(row.date.toISOString().slice(0, 10))
    if (!lastTrained || row.date > lastTrained) lastTrained = row.date
  }

  const ranked = [...exerciseTotals.values()].sort((left, right) => right.volume - left.volume || right.sessions - left.sessions || left.name.localeCompare(right.name))
  const totalVolume = ranked.reduce((sum, exercise) => sum + exercise.volume, 0)
  const recentExercises = [...ranked].sort((left, right) => right.lastTrained - left.lastTrained).slice(0, options.recentLimit || 3).map(exercise => ({ ...exercise, daysAgo: Math.max(0, Math.floor((now - exercise.lastTrained) / DAY)), lastTrained: exercise.lastTrained.toISOString() }))
  const contributions = ranked.map(exercise => ({ id: exercise.id, name: exercise.name, volume: Math.round(exercise.volume), percentage: totalVolume ? Math.round(exercise.volume / totalVolume * 100) : 0 }))
  const equipmentCounts = ranked.reduce((counts, exercise) => ({ ...counts, [exercise.equipment]: (counts[exercise.equipment] || 0) + exercise.sessions }), {})
  const mostCommonEquipment = Object.entries(equipmentCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null
  const mostUsed = [...ranked].sort((a, b) => b.sessions - a.sessions || b.sets - a.sets || a.name.localeCompare(b.name))[0] || null
  const bestPerforming = [...ranked].sort((a, b) => b.bestEstimated1RM - a.bestEstimated1RM || b.volume - a.volume)[0] || null

  return {
    muscleId,
    recentExercises,
    exerciseFrequency: Object.fromEntries(ranked.map(exercise => [exercise.id, exercise.sessions])),
    weeklyVolume: Math.round(weeklyVolume), monthlyVolume: Math.round(monthlyVolume),
    bestWeight, bestEstimated1RM: Math.round(bestEstimated1RM * 10) / 10, bestVolume: Math.round(bestVolume),
    averageReps: setCount ? Math.round(totalReps / setCount * 10) / 10 : 0,
    averageIntensity: setCount ? Math.round(totalIntensity / setCount * 10) / 10 : 0,
    trainingFrequency: sessionDates.size,
    daysSinceLastTrained: lastTrained ? Math.max(0, Math.floor((now - lastTrained) / DAY)) : null,
    lastWeight: recentExercises[0]?.bestWeight || 0,
    mostCommonEquipment,
    mostCommonExercise: mostUsed?.name || null,
    trend: trendFromWeekly(weeklyBuckets, now),
    contributions,
    favoriteExercise: { mostUsed: mostUsed?.name || null, bestPerforming: bestPerforming?.name || null },
  }
}

function longestTrainingStreak(workouts) {
  const days = [...new Set((workouts || []).map(workout => dateOf(workout)).filter(Boolean).map(date => new Date(date).toISOString().slice(0, 10)))].sort()
  let longest = days.length ? 1 : 0
  let current = longest
  for (let index = 1; index < days.length; index += 1) {
    current = (new Date(days[index]) - new Date(days[index - 1])) / DAY === 1 ? current + 1 : 1
    longest = Math.max(longest, current)
  }
  return longest
}

/** Compares the latest session with all earlier sessions and returns structured PRs. */
export function detectProgression(workouts = [], exerciseLibrary = [], options = {}) {
  const ordered = [...(workouts || [])].filter(workout => dateOf(workout)).sort((a, b) => new Date(dateOf(a)) - new Date(dateOf(b)))
  const latest = ordered.at(-1)
  const previousRows = flattenHistory(ordered.slice(0, -1), exerciseLibrary)
  const previous = new Map()
  for (const row of previousRows) {
    const record = previous.get(row.id) || { weight: 0, reps: 0, volume: 0, estimated1RM: 0 }
    record.volume = Math.max(record.volume, row.sets.reduce((sum, set) => sum + finite(set.kg ?? set.weight) * finite(set.reps), 0))
    for (const set of row.sets) {
      const weight = finite(set.kg ?? set.weight)
      const reps = finite(set.reps)
      record.weight = Math.max(record.weight, weight); record.reps = Math.max(record.reps, reps); record.estimated1RM = Math.max(record.estimated1RM, estimatedOneRepMax(weight, reps))
    }
    previous.set(row.id, record)
  }
  const records = []
  for (const row of flattenHistory(latest ? [latest] : [], exerciseLibrary)) {
    const prior = previous.get(row.id) || { weight: 0, reps: 0, volume: 0, estimated1RM: 0 }
    const current = { weight: 0, reps: 0, volume: row.sets.reduce((sum, set) => sum + finite(set.kg ?? set.weight) * finite(set.reps), 0), estimated1RM: 0 }
    for (const set of row.sets) { const weight = finite(set.kg ?? set.weight); const reps = finite(set.reps); current.weight = Math.max(current.weight, weight); current.reps = Math.max(current.reps, reps); current.estimated1RM = Math.max(current.estimated1RM, estimatedOneRepMax(weight, reps)) }
    for (const type of ['volume', 'weight', 'reps', 'estimated1RM']) if (current[type] > prior[type]) records.push({ type, exerciseId: row.id, exerciseName: row.name, value: Math.round(current[type] * 10) / 10, previous: Math.round(prior[type] * 10) / 10, isFirstRecord: prior[type] === 0 })
  }
  const muscleFrequency = {}
  for (const row of flattenHistory(ordered, exerciseLibrary)) for (const id of Object.keys(row.exercise.activationWeights?.primary || {}).concat(Object.keys(row.exercise.activationWeights?.secondary || {}), row.exercise.primary || [], row.exercise.secondary || [])) muscleFrequency[id] = (muscleFrequency[id] || 0) + 1
  return { records, hasNewPr: records.some(record => !record.isFirstRecord), longestStreak: longestTrainingStreak(ordered), mostConsistentMuscle: Object.entries(muscleFrequency).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null }
}

export function buildWorkoutCompletionFeedback(workouts = [], exerciseLibrary = [], recovery = {}) {
  const progression = detectProgression(workouts, exerciseLibrary)
  const latest = workouts.at(-1)
  const rows = flattenHistory(latest ? [latest] : [], exerciseLibrary)
  const musclesImproved = [...new Set(rows.flatMap(row => [...(row.exercise.primary || row.exercise.primaryMuscles || []), ...(row.exercise.secondary || row.exercise.secondaryMuscles || [])]))]
  const volumeAdded = Math.round(rows.reduce((total, row) => total + row.sets.reduce((sum, set) => sum + finite(set.kg ?? set.weight) * finite(set.reps), 0), 0))
  const recoveryImpact = recovery.overallFatigue >= 70 ? 'high' : volumeAdded > 0 ? 'moderate' : 'low'
  return { musclesImproved, recoveryImpact, volumeAdded, newPr: progression.records.filter(record => !record.isFirstRecord), coachComment: volumeAdded ? 'Passet är sparat. Belastningen används i nästa återhämtnings- och träningsrekommendation.' : 'Passet är sparat. Logga slutförda set för djupare historik.', progression }
}
