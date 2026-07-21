import { getAtlasState, setAtlasState } from './atlasStore'
import { applyWorkoutToRecovery, recoveryScore } from './recoveryEngine'
import { evaluateAtlasDecisions } from './decisionEngine'
import { evaluateGoalPlan, normalizeGoal } from './goalEngine'
import { refreshAtlasMemory } from './memoryEngine'
import { refreshAtlasPredictions } from './predictionEngine'

export const ATLAS_EVENTS = {
  WORKOUT_FINISHED: 'workout.finished',
  PROFILE_UPDATED: 'profile.updated',
  GOAL_UPDATED: 'goal.updated',
  RECOVERY_UPDATED: 'recovery.updated'
}

const inferredPrograms = {
  'Överkropp A': { Bröst: 1, Rygg: 1, Axlar: .7, Triceps: .55, Biceps: .55 },
  'Underkropp A': { Ben: 1, 'Baksida lår': .75, Säte: .75, Bål: .35, Vader: .35 },
  'Helkropp 50+': { Bröst: .6, Rygg: .7, Axlar: .45, Ben: .75, 'Baksida lår': .55, Säte: .5, Bål: .35 },
  Push: { Bröst: 1, Axlar: .8, Triceps: .75 },
  Pull: { Rygg: 1, Biceps: .75, 'Baksida lår': .35 },
  Legs: { Ben: 1, 'Baksida lår': .8, Säte: .8, Vader: .45 }
}

function normalizeWorkout(payload) {
  if (payload.exercises?.length) return payload
  const contribution = inferredPrograms[payload.name] || { Bål: .2 }
  const completedSets = Math.max(1, Number(payload.sets || 1))
  return {
    ...payload,
    exercises: [{
      id: `inferred-${payload.id}`,
      name: payload.name,
      muscleContribution: contribution,
      sets: Array.from({ length: completedSets }, (_, index) => ({ id: index, done: true, reps: 8, rpe: 8 }))
    }]
  }
}

function workoutTimestamp(workout) {
  if (workout.completedAt) return new Date(workout.completedAt).getTime()
  if (workout.date) return new Date(`${workout.date}T18:00:00`).getTime()
  return Date.now()
}

function attachDecisions(state, context) {
  const result = evaluateAtlasDecisions(state, context)
  return {
    ...state,
    decisions: {
      current: result.current,
      history: [...result.generated, ...(state.decisions?.history || [])].slice(0, 250),
      logs: [result.log, ...(state.decisions?.logs || [])].slice(0, 100)
    }
  }
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
    if ((current.workouts || []).some(workout => String(workout.id) === String(payload.id))) return null
    const workout = normalizeWorkout(payload)
    const muscles = applyWorkoutToRecovery(current.recovery?.muscles, workout, workoutTimestamp(workout))
    next = {
      ...next,
      workouts: [workout, ...(current.workouts || [])].slice(0, 500),
      recovery: {
        muscles,
        score: recoveryScore(muscles, Date.now()),
        updatedAt: event.createdAt
      }
    }
    next = refreshAtlasMemory(next)
    next = refreshAtlasPredictions(next)
    next = attachDecisions(next, { trigger: type, workout })
  }

  if (type === ATLAS_EVENTS.PROFILE_UPDATED) {
    next = { ...next, profile: { ...(current.profile || {}), ...payload } }
    next = refreshAtlasMemory(next)
    next = refreshAtlasPredictions(next)
    next = attachDecisions(next, { trigger: type })
  }

  if (type === ATLAS_EVENTS.GOAL_UPDATED) {
    const goal = normalizeGoal(payload)
    const goals = [...(current.goals || [])]
    const index = goals.findIndex(item => item.id === goal.id)
    if (index >= 0) goals[index] = { ...goals[index], ...goal }
    else goals.unshift(goal)

    const plan = evaluateGoalPlan(goal, { ...current, goals })
    next = {
      ...next,
      goals,
      goalPlans: {
        active: plan,
        history: [plan, ...(current.goalPlans?.history || [])].slice(0, 100)
      }
    }
    next = refreshAtlasPredictions(next)
    next = attachDecisions(next, { trigger: type, goal, goalPlan: plan })
  }

  if (type === ATLAS_EVENTS.RECOVERY_UPDATED) {
    next = {
      ...next,
      recovery: { ...(current.recovery || {}), ...payload, updatedAt: event.createdAt }
    }
    next = refreshAtlasPredictions(next)
    next = attachDecisions(next, { trigger: type })
  }

  setAtlasState(next)
  return event
}

export function recordCompletedWorkout(workout) {
  return dispatchAtlasEvent(ATLAS_EVENTS.WORKOUT_FINISHED, workout)
}

export function updateAtlasGoal(goal) {
  return dispatchAtlasEvent(ATLAS_EVENTS.GOAL_UPDATED, goal)
}

export function updateAtlasRecovery(recovery) {
  return dispatchAtlasEvent(ATLAS_EVENTS.RECOVERY_UPDATED, recovery)
}
