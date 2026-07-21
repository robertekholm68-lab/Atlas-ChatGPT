const DAY_MS = 24 * 60 * 60 * 1000

function workoutTime(workout) {
  const value = workout?.completedAt || workout?.date
  if (!value) return 0
  const parsed = new Date(workout.completedAt || `${workout.date}T18:00:00`).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

function completedSets(exercise) {
  return (exercise?.sets || []).filter(set => set.done !== false)
}

function exerciseKey(exercise) {
  return String(exercise?.id || exercise?.name || 'unknown').toLowerCase()
}

function createExerciseMemory(exercise) {
  return {
    id: exercise?.id || null,
    name: exercise?.name || 'Okänd övning',
    sessions: 0,
    completedSets: 0,
    totalReps: 0,
    totalVolume: 0,
    bestWeight: 0,
    bestEstimatedOneRepMax: 0,
    latestWeight: 0,
    latestRpe: null,
    latestAt: null
  }
}

function estimatedOneRepMax(weight, reps) {
  const kg = Number(weight || 0)
  const count = Number(reps || 0)
  if (!kg || !count) return 0
  return Math.round((kg * (1 + count / 30)) * 10) / 10
}

function buildExerciseMemories(workouts) {
  const memories = new Map()

  ;[...workouts].sort((a, b) => workoutTime(a) - workoutTime(b)).forEach(workout => {
    ;(workout.exercises || []).forEach(exercise => {
      const key = exerciseKey(exercise)
      const memory = memories.get(key) || createExerciseMemory(exercise)
      const sets = completedSets(exercise)
      if (!sets.length) return

      memory.sessions += 1
      memory.completedSets += sets.length
      memory.latestAt = workout.completedAt || workout.date || memory.latestAt

      sets.forEach(set => {
        const reps = Number(set.reps || 0)
        const weight = Number(set.kg || set.weight || 0)
        const rpe = Number(set.rpe)
        const estimatedMax = estimatedOneRepMax(weight, reps)

        memory.totalReps += reps
        memory.totalVolume += weight * reps
        memory.bestWeight = Math.max(memory.bestWeight, weight)
        memory.bestEstimatedOneRepMax = Math.max(memory.bestEstimatedOneRepMax, estimatedMax)
        if (weight) memory.latestWeight = weight
        if (Number.isFinite(rpe)) memory.latestRpe = rpe
      })

      memories.set(key, memory)
    })
  })

  return [...memories.values()]
    .map(memory => ({ ...memory, totalVolume: Math.round(memory.totalVolume) }))
    .sort((a, b) => b.sessions - a.sessions || b.completedSets - a.completedSets)
}

function buildTrainingPattern(workouts, now) {
  const valid = workouts.filter(workout => workoutTime(workout) > 0)
  const recent28 = valid.filter(workout => now - workoutTime(workout) <= 28 * DAY_MS)
  const weekdays = Array.from({ length: 7 }, () => 0)

  valid.forEach(workout => {
    const date = new Date(workoutTime(workout))
    weekdays[date.getDay()] += 1
  })

  const favoriteDayIndex = weekdays.indexOf(Math.max(...weekdays))
  const swedishDays = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag']

  return {
    totalSessions: valid.length,
    sessionsLast28Days: recent28.length,
    averageSessionsPerWeek: Math.round((recent28.length / 4) * 10) / 10,
    favoriteTrainingDay: valid.length ? swedishDays[favoriteDayIndex] : null,
    lastWorkoutAt: valid.length ? new Date(Math.max(...valid.map(workoutTime))).toISOString() : null,
    daysSinceLastWorkout: valid.length ? Math.max(0, Math.floor((now - Math.max(...valid.map(workoutTime))) / DAY_MS)) : null
  }
}

function extractPainMemories(events) {
  const terms = ['smärta', 'ont', 'värk', 'instabil', 'skada', 'axel', 'knä', 'rygg', 'vad', 'ljumske']
  return (events || [])
    .filter(event => event.type === 'profile.updated')
    .flatMap(event => Object.entries(event.payload || {})
      .filter(([, value]) => typeof value === 'string' && terms.some(term => value.toLowerCase().includes(term)))
      .map(([field, value]) => ({
        id: `pain-${event.id}-${field}`,
        type: 'pain-note',
        field,
        text: value,
        createdAt: event.createdAt
      })))
    .slice(0, 50)
}

function buildCoachMemories(state, exerciseMemories, pattern, painMemories) {
  const memories = []
  const favorite = exerciseMemories[0]
  const strongest = [...exerciseMemories].sort((a, b) => b.bestEstimatedOneRepMax - a.bestEstimatedOneRepMax)[0]

  if (favorite) memories.push({
    id: `favorite-exercise-${exerciseKey(favorite)}`,
    type: 'training-preference',
    title: `${favorite.name} är en återkommande övning`,
    detail: `${favorite.sessions} registrerade pass och ${favorite.completedSets} genomförda set.`,
    confidence: Math.min(1, favorite.sessions / 8),
    updatedAt: favorite.latestAt
  })

  if (strongest?.bestEstimatedOneRepMax) memories.push({
    id: `strength-marker-${exerciseKey(strongest)}`,
    type: 'strength-marker',
    title: `Styrkemarkör i ${strongest.name}`,
    detail: `Bästa uppskattade 1RM är ${strongest.bestEstimatedOneRepMax} kg.`,
    confidence: Math.min(1, strongest.completedSets / 12),
    updatedAt: strongest.latestAt
  })

  if (pattern.favoriteTrainingDay) memories.push({
    id: 'favorite-training-day',
    type: 'habit',
    title: `${pattern.favoriteTrainingDay} är vanligaste träningsdagen`,
    detail: `Träningsfrekvensen de senaste fyra veckorna är ${pattern.averageSessionsPerWeek} pass per vecka.`,
    confidence: Math.min(1, pattern.totalSessions / 12),
    updatedAt: new Date().toISOString()
  })

  painMemories.slice(0, 5).forEach(item => memories.push({
    id: item.id,
    type: 'health-context',
    title: 'Tidigare rapporterat besvär',
    detail: item.text,
    confidence: 1,
    updatedAt: item.createdAt
  }))

  return memories.slice(0, 100)
}

export function buildAtlasMemory(state, now = Date.now()) {
  const workouts = state.workouts || []
  const exercises = buildExerciseMemories(workouts)
  const trainingPattern = buildTrainingPattern(workouts, now)
  const painNotes = extractPainMemories(state.events)
  const memories = buildCoachMemories(state, exercises, trainingPattern, painNotes)

  return {
    generatedAt: new Date(now).toISOString(),
    trainingPattern,
    exercises,
    personalRecords: exercises
      .filter(item => item.bestWeight > 0 || item.bestEstimatedOneRepMax > 0)
      .map(item => ({
        exerciseId: item.id,
        exerciseName: item.name,
        bestWeight: item.bestWeight,
        bestEstimatedOneRepMax: item.bestEstimatedOneRepMax,
        updatedAt: item.latestAt
      })),
    painNotes,
    memories
  }
}

export function refreshAtlasMemory(state, now = Date.now()) {
  const memory = buildAtlasMemory(state, now)
  return {
    ...state,
    memory,
    coach: {
      ...(state.coach || {}),
      memories: memory.memories
    }
  }
}

export function findExerciseMemory(memory, exercise) {
  const key = String(exercise?.id || exercise?.name || exercise || '').toLowerCase()
  return (memory?.exercises || []).find(item => exerciseKey(item) === key) || null
}
