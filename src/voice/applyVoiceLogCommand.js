import { addWorkoutSet, completeWorkoutSet, copyPreviousSet, removeWorkoutSet, updateWorkoutSet } from '../workoutSessionModel.js'

const voiceOperationHistory = new WeakMap()

export function applyVoiceLogCommand(session, exerciseIndex, setIndex, command, now = Date.now(), autoRest = true) {
  if (!command?.valid) return session
  if (command.intent === 'undo_voice_operation') return voiceOperationHistory.get(session) || session
  let updated = session
  if (command.intent === 'remove_last_set') {
    const lastIndex = session.exercises[exerciseIndex]?.sets.length - 1
    updated = lastIndex >= 0 ? removeWorkoutSet(session, exerciseIndex, lastIndex) : session
  } else if (command.intent === 'mark_last_set_failed') {
    const sets = session.exercises[exerciseIndex]?.sets || []
    const lastCompletedIndex = sets.findLastIndex(set => set.done)
    updated = lastCompletedIndex >= 0 ? updateWorkoutSet(session, exerciseIndex, lastCompletedIndex, { done: false, completedAt: null }) : session
  } else if (command.intent === 'add_sets') {
    const count = Math.min(10, Math.max(1, Math.round(Number(command.setCount) || 1)))
    for (let index = 0; index < count; index += 1) updated = addWorkoutSet(updated, exerciseIndex, now + index)
    if (command.currentSet?.weightKg != null) {
      const firstAddedIndex = updated.exercises[exerciseIndex].sets.length - count
      for (let index = firstAddedIndex; index < updated.exercises[exerciseIndex].sets.length; index += 1) updated = updateWorkoutSet(updated, exerciseIndex, index, { kg: command.currentSet.weightKg })
    }
  } else if (command.intent === 'copy_previous_set') {
    updated = copyPreviousSet(session, exerciseIndex, setIndex)
  }
  if (updated !== session) {
    voiceOperationHistory.set(updated, session)
    return updated
  }
  const current = command.currentSet || {}
  const patch = {}
  if (current.weightKg != null) patch.kg = current.weightKg
  if (current.reps != null) patch.reps = current.reps
  if (current.rpe != null) patch.rpe = current.rpe
  updated = Object.keys(patch).length ? updateWorkoutSet(session, exerciseIndex, setIndex, patch) : session
  if (current.completed && !updated.exercises[exerciseIndex]?.sets[setIndex]?.done) updated = completeWorkoutSet(updated, exerciseIndex, setIndex, now, autoRest)
  const nextIndex = setIndex + 1
  const next = command.nextSet || {}
  const nextCurrent = updated.exercises[exerciseIndex]?.sets[nextIndex]
  if (nextCurrent && (next.weightKg != null || next.weightDeltaKg != null)) {
    const kg = next.weightKg ?? Number(updated.exercises[exerciseIndex].sets[setIndex].kg) + next.weightDeltaKg
    updated = updateWorkoutSet(updated, exerciseIndex, nextIndex, { kg })
  }
  if (updated !== session) voiceOperationHistory.set(updated, session)
  return updated
}
