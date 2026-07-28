import { completeWorkoutSet, updateWorkoutSet } from '../workoutSessionModel.js'

export function applyVoiceLogCommand(session, exerciseIndex, setIndex, command, now = Date.now(), autoRest = true) {
  if (!command?.valid) return session
  const current = command.currentSet || {}
  const patch = {}
  if (current.weightKg != null) patch.kg = current.weightKg
  if (current.reps != null) patch.reps = current.reps
  if (current.rpe != null) patch.rpe = current.rpe
  let updated = Object.keys(patch).length ? updateWorkoutSet(session, exerciseIndex, setIndex, patch) : session
  if (current.completed && !updated.exercises[exerciseIndex]?.sets[setIndex]?.done) updated = completeWorkoutSet(updated, exerciseIndex, setIndex, now, autoRest)
  const nextIndex = setIndex + 1
  const next = command.nextSet || {}
  const nextCurrent = updated.exercises[exerciseIndex]?.sets[nextIndex]
  if (nextCurrent && (next.weightKg != null || next.weightDeltaKg != null)) {
    const kg = next.weightKg ?? Number(updated.exercises[exerciseIndex].sets[setIndex].kg) + next.weightDeltaKg
    updated = updateWorkoutSet(updated, exerciseIndex, nextIndex, { kg })
  }
  return updated
}

