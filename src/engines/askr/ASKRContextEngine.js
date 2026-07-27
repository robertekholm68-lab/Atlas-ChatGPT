import { ASKR_CONTEXT_VERSION, DATA_QUALITY_STATES, deepFreeze } from './ASKRModels.js'

const list = value => Array.isArray(value) ? value : []
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {}
const summary = (value, keys) => Object.fromEntries(keys.filter(key => value?.[key] !== undefined).map(key => [key, value[key]]))

export function assessDataQuality(input = {}) {
  const domains = ['training', 'muscles', 'progress', 'goals', 'health', 'recovery', 'nutrition', 'behavior']
  return Object.fromEntries(domains.map(domain => {
    const supplied = input.dataQuality?.[domain]
    if (DATA_QUALITY_STATES.includes(supplied)) return [domain, supplied]
    const source = input[`${domain}Status`] ?? input[domain]
    if (source === undefined || source === null || (Array.isArray(source) && !source.length)) return [domain, 'missing']
    if (source?.updatedAt && Date.parse(input.currentDate) - Date.parse(source.updatedAt) > 7 * 86400000) return [domain, 'stale']
    return [domain, source?.source === 'manual' ? 'good' : 'excellent']
  }))
}

export function buildASKRContext(input = {}) {
  const currentDate = new Date(input.currentDate || Date.now()).toISOString()
  const context = {
    version: ASKR_CONTEXT_VERSION,
    userProfile: summary(object(input.userProfile), ['id', 'ageRange', 'experienceLevel', 'activityLevel']),
    goals: list(input.goals).map(goal => summary(goal, ['id', 'type', 'priority', 'target', 'status'])),
    preferences: summary(object(input.preferences), ['trainingDays', 'preferredTime', 'preferredSplit', 'avoidActivities']),
    trainingHistory: list(input.trainingHistory).slice(-28).map(item => summary(item, ['id', 'date', 'completedAt', 'type', 'duration', 'load', 'rating'])),
    currentWorkoutPlan: summary(object(input.currentWorkoutPlan), ['id', 'workoutId', 'type', 'intensity', 'duration', 'muscleGroups', 'scheduledAt']),
    muscleStatus: object(input.muscleStatus), progressStatus: object(input.progressStatus), healthStatus: object(input.healthStatus),
    recoveryStatus: object(input.recoveryStatus), nutritionStatus: object(input.nutritionStatus),
    recentCoachActions: list(input.recentCoachActions).slice(-10), userFeedback: list(input.userFeedback).slice(-20),
    availableEquipment: list(input.availableEquipment), availableTime: Math.max(0, Number(input.availableTime ?? 45)), currentDate,
    dataQuality: assessDataQuality({ ...input, currentDate }), domainSignals: list(input.domainSignals),
  }
  return deepFreeze(context)
}
