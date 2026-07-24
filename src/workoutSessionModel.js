import { activeWorkout, exerciseLibrary, muscles } from './workoutData.js'

export const workoutStorageKeys = {
  demoActive: 'askr-demo-active-workout-v1',
  realActive: 'askr-real-active-workout-v1',
  demoHistory: 'askr-demo-workout-history-v1',
  realHistory: 'askr-real-workout-history-v1'
}

export function modeKeys(mode = 'real') {
  const real = mode === 'real'
  return { active: real ? workoutStorageKeys.realActive : workoutStorageKeys.demoActive, history: real ? workoutStorageKeys.realHistory : workoutStorageKeys.demoHistory }
}

export function createWorkoutSession({ mode = 'real', now = new Date().toISOString() } = {}) {
  return {
    id: `workout-${mode}-${now}`,
    mode,
    name: activeWorkout.name,
    status: 'planned',
    startedAt: null,
    finishedAt: null,
    updatedAt: now,
    notes: '',
    activeExerciseIndex: 0,
    activeSetId: null,
    restTimer: { secondsRemaining: 0, duration: 0, running: false, startedAt: null },
    exercises: activeWorkout.exercises.map((exercise, order) => ({
      exerciseId: exercise.exerciseId,
      order,
      targetSets: exercise.targetSets,
      restDuration: exercise.rest,
      tempo: exercise.tempo,
      notes: '',
      sets: Array.from({ length: exercise.targetSets }, (_, index) => ({
        id: `${exercise.exerciseId}-set-${index + 1}`,
        order: index,
        weight: '',
        reps: '',
        rpe: '',
        rir: '',
        completed: false,
        completedAt: null,
        startedAt: null,
        notes: '',
        restDuration: exercise.rest,
        type: exerciseLibrary.find(item => item.id === exercise.exerciseId)?.setType || 'working'
      }))
    }))
  }
}

export function safeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

export function calculateWorkoutSummary(workout, library = exerciseLibrary) {
  const exercises = workout?.exercises || []
  const completedSets = exercises.flatMap(exercise => exercise.sets || []).filter(set => set.completed)
  const totalVolume = completedSets.reduce((sum, set) => sum + safeNumber(set.weight) * safeNumber(set.reps), 0)
  const trained = new Set()
  let completedExercises = 0
  for (const block of exercises) {
    const hasCompletedSet = (block.sets || []).some(set => set.completed)
    if (hasCompletedSet) completedExercises += 1
    const exercise = library.find(item => item.id === block.exerciseId)
    if (hasCompletedSet && exercise) [...exercise.primaryMuscles, ...exercise.secondaryMuscles].forEach(id => trained.add(id))
  }
  const started = workout?.startedAt ? Date.parse(workout.startedAt) : NaN
  const ended = workout?.finishedAt ? Date.parse(workout.finishedAt) : Date.now()
  const durationSeconds = Number.isFinite(started) ? Math.max(0, Math.round((ended - started) / 1000)) : 0
  return { durationSeconds, exercisesCompleted: completedExercises, setsCompleted: completedSets.length, totalVolume, musclesTrained: [...trained].map(id => muscles[id]?.name || id), personalRecords: [] }
}

export function completeSet(workout, exerciseIndex, setIndex, values = {}, now = new Date().toISOString()) {
  const next = structuredClone(workout)
  const block = next.exercises[exerciseIndex]
  if (!block || !block.sets[setIndex]) return workout
  block.sets[setIndex] = { ...block.sets[setIndex], ...values, completed: true, completedAt: now, startedAt: block.sets[setIndex].startedAt || now }
  next.status = 'active'
  next.updatedAt = now
  next.activeExerciseIndex = exerciseIndex
  next.activeSetId = block.sets[setIndex + 1]?.id || null
  next.restTimer = { secondsRemaining: block.restDuration, duration: block.restDuration, running: true, startedAt: now }
  return next
}

export function saveCompletedWorkout(workout, history = [], now = new Date().toISOString()) {
  const completed = { ...workout, status: 'completed', finishedAt: workout.finishedAt || now, updatedAt: now }
  const withoutDuplicate = history.filter(item => item.id !== completed.id)
  return { completed, history: [completed, ...withoutDuplicate] }
}
