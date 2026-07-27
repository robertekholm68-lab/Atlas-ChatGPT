import {
  createRestTimer,
  extendRestTimer,
  normalizeRestTimer,
  pauseRestTimer,
  resumeRestTimer,
  skipRestTimer
} from './restTimerEngine.js'

export const WORKOUT_MODE = Object.freeze({ REAL: 'real', DEMO: 'demo' })
export const WORKOUT_STORAGE_KEY = 'askr-gym-mode-v1'

const number = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const modeOf = mode => mode === WORKOUT_MODE.DEMO ? WORKOUT_MODE.DEMO : WORKOUT_MODE.REAL
const setId = (exerciseId, index, now) => `${exerciseId}-set-${now}-${index}`

export function normalizeWorkoutSet(set = {}, exerciseId = 'exercise', index = 0, now = Date.now()) {
  return {
    ...set,
    id: String(set.id || setId(exerciseId, index, now)),
    kg: Math.max(0, number(set.kg ?? set.weight)),
    reps: Math.max(0, Math.round(number(set.reps))),
    rpe: Math.min(10, Math.max(0, number(set.rpe, 8))),
    rest: Math.max(0, Math.round(number(set.rest, 90))),
    done: Boolean(set.done),
    completedAt: set.completedAt || null
  }
}

export function normalizeWorkoutSession(session, now = Date.now()) {
  if (!session || typeof session !== 'object' || !Array.isArray(session.exercises)) return null
  const startedAt = number(session.startedAt, now)
  return {
    ...session,
    id: String(session.id || `workout-${startedAt}`),
    mode: modeOf(session.mode),
    startedAt,
    exercises: session.exercises.filter(Boolean).map((exercise, exerciseIndex) => ({
      ...exercise,
      id: String(exercise.id || exercise.exerciseId || `exercise-${exerciseIndex}`),
      exerciseId: String(exercise.exerciseId || exercise.id || `exercise-${exerciseIndex}`),
      restDurationSeconds: Math.max(0, Math.round(number(exercise.restDurationSeconds ?? exercise.rest, 90))),
      sets: Array.isArray(exercise.sets)
        ? exercise.sets.map((set, setIndex) => normalizeWorkoutSet(set, exercise.id || exercise.exerciseId, setIndex, startedAt))
        : []
    })),
    restTimer: normalizeRestTimer(session.restTimer, now)
  }
}

export function startWorkout(program, exerciseLibrary, options = {}) {
  const now = number(options.now, Date.now())
  const library = Array.isArray(exerciseLibrary) ? exerciseLibrary : []
  const ids = Array.isArray(program?.exercises) ? program.exercises : []
  const exercises = ids.map(id => library.find(exercise => exercise.id === id)).filter(Boolean).map(exercise => {
    const targetSets = Math.max(1, Math.round(number(exercise.targetSets ?? String(exercise.sets || '').match(/\d+/)?.[0], 3)))
    const rest = Math.max(0, Math.round(number(exercise.restDurationSeconds ?? exercise.rest, 90)))
    return {
      ...exercise,
      exerciseId: exercise.id,
      restDurationSeconds: rest,
      sets: Array.from({ length: targetSets }, (_, index) => normalizeWorkoutSet({
        kg: number(options.previousValues?.[exercise.id]?.kg ?? exercise.previousKg),
        reps: number(options.previousValues?.[exercise.id]?.reps, 8),
        rpe: 8,
        tempo: exercise.tempo || '3-1-1',
        rest
      }, exercise.id, index, now))
    }
  })
  return normalizeWorkoutSession({ id: `workout-${now}`, programId: program?.id, name: program?.name || 'Träningspass', mode: modeOf(options.mode), startedAt: now, exercises }, now)
}

const updateExercise = (session, exerciseIndex, updater) => ({
  ...session,
  exercises: session.exercises.map((exercise, index) => index === exerciseIndex ? updater(exercise) : exercise)
})

export function updateWorkoutSet(session, exerciseIndex, setIndex, patch) {
  return updateExercise(session, exerciseIndex, exercise => ({
    ...exercise,
    sets: exercise.sets.map((set, index) => index === setIndex
      ? normalizeWorkoutSet({ ...set, ...patch }, exercise.id, index, session.startedAt)
      : set)
  }))
}

export function copyPreviousSet(session, exerciseIndex, setIndex) {
  const exercise = session.exercises[exerciseIndex]
  const previous = exercise?.sets[setIndex - 1] || exercise?.previousValues
  if (!previous) return session
  return updateWorkoutSet(session, exerciseIndex, setIndex, {
    kg: previous.kg ?? previous.weight,
    reps: previous.reps,
    rpe: previous.rpe,
    tempo: previous.tempo,
    notes: previous.notes
  })
}

export function completeWorkoutSet(session, exerciseIndex, setIndex, now = Date.now(), autoRest = true) {
  const current = session.exercises[exerciseIndex]?.sets[setIndex]
  if (!current) return session
  const completing = !current.done
  const updated = updateWorkoutSet(session, exerciseIndex, setIndex, {
    done: completing,
    completedAt: completing ? new Date(now).toISOString() : null
  })
  if (!completing || !autoRest) return updated
  const exercise = updated.exercises[exerciseIndex]
  const duration = current.rest || exercise.restDurationSeconds || 90
  return { ...updated, restTimer: createRestTimer(duration, now) }
}

export function addWorkoutSet(session, exerciseIndex, now = Date.now()) {
  return updateExercise(session, exerciseIndex, exercise => {
    const previous = exercise.sets.at(-1) || {}
    return { ...exercise, sets: [...exercise.sets, normalizeWorkoutSet({ ...previous, id: null, done: false, completedAt: null }, exercise.id, exercise.sets.length, now)] }
  })
}

export function removeWorkoutSet(session, exerciseIndex, setIndex) {
  return updateExercise(session, exerciseIndex, exercise => ({ ...exercise, sets: exercise.sets.filter((_, index) => index !== setIndex) }))
}

export function addWorkoutExercise(session, exercise, now = Date.now()) {
  if (!exercise || session.exercises.some(item => item.exerciseId === exercise.id)) return session
  const rest = number(exercise.restDurationSeconds ?? exercise.rest, 90)
  const added = normalizeWorkoutSession({ ...session, exercises: [...session.exercises, { ...exercise, exerciseId: exercise.id, restDurationSeconds: rest, sets: [normalizeWorkoutSet({ rest }, exercise.id, 0, now)] }] }, now)
  return added
}

export function replaceWorkoutExercise(session, exerciseIndex, exercise, now = Date.now()) {
  if (!exercise || exerciseIndex < 0 || exerciseIndex >= session.exercises.length) return session
  const rest = number(exercise.restDurationSeconds ?? exercise.rest, 90)
  return normalizeWorkoutSession({ ...session, exercises: session.exercises.map((item, index) => index === exerciseIndex ? { ...exercise, exerciseId: exercise.id, restDurationSeconds: rest, sets: item.sets.map((set, setIndex) => normalizeWorkoutSet({ ...set, rest, done: false, completedAt: null }, exercise.id, setIndex, now)) } : item) }, now)
}

export function removeWorkoutExercise(session, exerciseIndex) {
  return { ...session, exercises: session.exercises.filter((_, index) => index !== exerciseIndex) }
}

export const pauseWorkoutRest = (session, now = Date.now()) => ({ ...session, restTimer: pauseRestTimer(session.restTimer, now) })
export const resumeWorkoutRest = (session, now = Date.now()) => ({ ...session, restTimer: resumeRestTimer(session.restTimer, now) })
export const skipWorkoutRest = (session, now = Date.now()) => ({ ...session, restTimer: skipRestTimer(session.restTimer, now) })
export const extendWorkoutRest = (session, seconds = 30, now = Date.now()) => ({ ...session, restTimer: extendRestTimer(session.restTimer, seconds, now) })

export function workoutSummary(session, now = Date.now()) {
  const sets = session.exercises.flatMap(exercise => exercise.sets).filter(set => set.done)
  return {
    id: session.id,
    sessionId: session.id,
    mode: modeOf(session.mode),
    date: new Date(now).toISOString().slice(0, 10),
    name: session.name,
    sets: sets.length,
    volume: Math.round(sets.reduce((sum, set) => sum + set.kg * set.reps, 0)),
    duration: Math.max(1, Math.round((now - session.startedAt) / 60000)),
    completedAt: new Date(now).toISOString(),
    exercises: session.exercises.map(exercise => ({ ...exercise, sets: exercise.sets.filter(set => set.done).map(set => ({ ...set })) }))
  }
}

export function saveCompletedWorkout(history, completed) {
  const entries = Array.isArray(history) ? history : []
  const withoutDuplicate = entries.filter(item => String(item.sessionId || item.id) !== String(completed.sessionId || completed.id))
  return [completed, ...withoutDuplicate]
}

export function parseWorkoutState(raw, now = Date.now()) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!parsed || typeof parsed !== 'object') return { mode: WORKOUT_MODE.REAL, real: {}, demo: {} }
    return {
      mode: modeOf(parsed.mode),
      real: { ...(parsed.real || {}), session: normalizeWorkoutSession(parsed.real?.session, now) },
      demo: { ...(parsed.demo || {}), session: normalizeWorkoutSession(parsed.demo?.session, now) }
    }
  } catch {
    return { mode: WORKOUT_MODE.REAL, real: {}, demo: {} }
  }
}

export function serializeWorkoutState(state) {
  return JSON.stringify(parseWorkoutState(state))
}

export function activeModeState(state) {
  const mode = modeOf(state?.mode)
  return state?.[mode] || {}
}
