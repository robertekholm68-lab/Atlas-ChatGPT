import { getAtlasState, setAtlasState } from './atlasStore'
import { applyWorkoutToRecovery, recoveryScore } from './recoveryEngine'

export const ATLAS_EVENTS = {
  WORKOUT_FINISHED: 'workout.finished',
  PROFILE_UPDATED: 'profile.updated',
  GOAL_UPDATED: 'goal.updated'
}

export function dispatchAtlasEvent(type, payload = {}) {
  const event = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: new Date().toISOString()
  }

  const current = getAtlasState()
  let next = { ...current, events: [event, ...(current.events || [])].slice(0, 250) }

  if (type === ATLAS_EVENTS.WORKOUT_FINISHED) {
    const muscles = applyWorkoutToRecovery(current.recovery?.muscles, payload)
    next = {
      ...next,
      workouts: [payload, ...(current.workouts || [])].slice(0, 500),
      recovery: {
        muscles,
        score: recoveryScore(muscles),
        updatedAt: event.createdAt
      }
    }
  }

  if (type === ATLAS_EVENTS.PROFILE_UPDATED) {
    next = { ...next, profile: { ...(current.profile || {}), ...payload } }
  }

  if (type === ATLAS_EVENTS.GOAL_UPDATED) {
    const goals = [...(current.goals || [])]
    const index = goals.findIndex(goal => goal.id === payload.id)
    if (index >= 0) goals[index] = { ...goals[index], ...payload }
    else goals.unshift(payload)
    next = { ...next, goals }
  }

  setAtlasState(next)
  return event
}

export function recordCompletedWorkout(workout) {
  return dispatchAtlasEvent(ATLAS_EVENTS.WORKOUT_FINISHED, workout)
}
