import { evaluateCompletedSet } from './ExerciseEngine.js'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const emptyMuscle = () => ({ accumulatedLoad: 0, weeklyEffectiveSets: 0, weeklyVolume: 0, frequency: 0, lastTrained: null })

function resolveExercise(exerciseId, exerciseLibrary = []) {
  return exerciseLibrary.find((exercise) => exercise.id === exerciseId) ?? { id: exerciseId, primary: [], secondary: [] }
}

export function aggregateEvaluatedSets(evaluatedSets = []) {
  const muscles = {}
  const trainedDatesByMuscle = {}

  for (const evaluatedSet of evaluatedSets) {
    for (const [muscleId, load] of Object.entries(evaluatedSet.weightedMuscleActivation ?? {})) {
      muscles[muscleId] = muscles[muscleId] ?? emptyMuscle()
      muscles[muscleId].accumulatedLoad += load.fatigueLoad ?? 0
      muscles[muscleId].weeklyEffectiveSets += load.effectiveSets ?? 0
      muscles[muscleId].weeklyVolume += load.volume ?? 0

      if (evaluatedSet.completedAt) {
        trainedDatesByMuscle[muscleId] = trainedDatesByMuscle[muscleId] ?? new Set()
        trainedDatesByMuscle[muscleId].add(new Date(evaluatedSet.completedAt).toISOString().slice(0, 10))
        if (!muscles[muscleId].lastTrained || new Date(evaluatedSet.completedAt) > new Date(muscles[muscleId].lastTrained)) {
          muscles[muscleId].lastTrained = evaluatedSet.completedAt
        }
      }
    }
  }

  for (const [muscleId, summary] of Object.entries(muscles)) {
    summary.accumulatedLoad = Number(summary.accumulatedLoad.toFixed(2))
    summary.weeklyEffectiveSets = Number(summary.weeklyEffectiveSets.toFixed(2))
    summary.weeklyVolume = Number(summary.weeklyVolume.toFixed(2))
    summary.frequency = trainedDatesByMuscle[muscleId]?.size ?? 0
  }

  return muscles
}

export function evaluateWorkoutSessions(sessions = [], exerciseLibrary = [], now = new Date()) {
  const weekStart = new Date(now).getTime() - WEEK_MS
  const evaluatedSets = []

  for (const session of sessions) {
    const sessionCompletedAt = session.completedAt ?? session.startedAt ?? session.date ?? null
    if (sessionCompletedAt && new Date(sessionCompletedAt).getTime() < weekStart) continue

    for (const workoutExercise of session.exercises ?? []) {
      const exercise = resolveExercise(workoutExercise.exerciseId, exerciseLibrary)
      for (const set of workoutExercise.sets ?? []) {
        evaluatedSets.push(evaluateCompletedSet({ ...set, exerciseId: workoutExercise.exerciseId }, exercise, set.completedAt ?? sessionCompletedAt))
      }
    }
  }

  return aggregateEvaluatedSets(evaluatedSets)
}
