import { ACTION_DEFINITIONS, deepFreeze, stableId } from './ASKRModels.js'

export function validateAction(action) {
  const definition = ACTION_DEFINITIONS[action?.type]
  const errors = []
  if (!definition) errors.push('unsupported_type')
  if (!action?.payload || typeof action.payload !== 'object') errors.push('invalid_payload')
  if (definition && !definition.presentation && action.requiresConfirmation !== true) errors.push('confirmation_required')
  return { valid: errors.length === 0, errors }
}

export function createAction(type, payload = {}) {
  const definition = ACTION_DEFINITIONS[type]
  const action = { id: stableId([type, JSON.stringify(payload)]), type, payload: { ...payload }, requiresConfirmation: !definition?.presentation }
  const validation = validateAction(action)
  if (!validation.valid) throw new TypeError(`Invalid ASKR action: ${validation.errors.join(', ')}`)
  return deepFreeze(action)
}

export function actionForSignal(signal, context) {
  const workoutId = context.currentWorkoutPlan.workoutId || context.currentWorkoutPlan.id || 'today'
  const actions = {
    LOW_READINESS: ['ADD_RECOVERY_SESSION', { duration: Math.min(20, context.availableTime), reasonCode: signal.type }],
    REDUCE_TRAINING_VOLUME: ['MODIFY_WORKOUT', { workoutId, volumeMultiplier: 0.8, reasonCode: signal.type }],
    MUSCLE_OVERLOADED: ['MODIFY_WORKOUT', { workoutId, volumeMultiplier: 0.7, reasonCode: signal.type }],
    HEAVY_SESSION_PLANNED: ['START_WORKOUT', { workoutId }], HYDRATION_LOW: ['LOG_WATER', { milliliters: 500 }],
    MISSING_NUTRITION_DATA: ['LOG_MEAL', { meal: 'next' }], VERY_LOW_ENERGY_AVAILABILITY: ['ADJUST_CALORIE_TARGET', { scope: 'training_day', reasonCode: signal.type }],
  }
  const [type, payload] = actions[signal.type] || ['SHOW_EXPLANATION', { signalId: signal.id }]
  return createAction(type, payload)
}
