export const ASKR_CONTEXT_VERSION = '1.0.0'
export const ASKR_ENGINE_VERSION = '4.10.0'

export const DOMAINS = Object.freeze(['training', 'muscles', 'progress', 'goals', 'health', 'recovery', 'nutrition', 'behavior'])
export const SEVERITIES = Object.freeze(['low', 'medium', 'high', 'critical'])
export const DATA_QUALITY_STATES = Object.freeze(['excellent', 'good', 'limited', 'stale', 'conflicting', 'missing'])
export const FEEDBACK_TYPES = Object.freeze(['HELPFUL', 'NOT_HELPFUL', 'TOO_DIFFICULT', 'TOO_EASY', 'CANNOT_DO_TODAY', 'INCORRECT_DATA', 'CHOSE_ALTERNATIVE'])

export const ACTION_DEFINITIONS = Object.freeze({
  OPEN_SCREEN: { presentation: true }, APPLY_FILTER: { presentation: true }, SHOW_EXPLANATION: { presentation: true },
  START_WORKOUT: {}, MODIFY_WORKOUT: {}, CHANGE_EXERCISE: {}, ADD_RECOVERY_SESSION: {}, LOG_WATER: {}, LOG_MEAL: {},
  ADJUST_CALORIE_TARGET: {}, ADJUST_MACROS: {}, MOVE_WORKOUT: {}, SCHEDULE_REST_DAY: {}, REVIEW_PROGRESS: {}, UPDATE_GOAL: {}, COMPLETE_HEALTH_CHECK_IN: {},
})

export function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.values(value).forEach(deepFreeze)
  return Object.freeze(value)
}

export function stableId(parts) {
  const text = parts.filter(value => value !== undefined && value !== null).join('|')
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619)
  return `askr-${(hash >>> 0).toString(36)}`
}

export function createSignal(signal, currentDate) {
  const timestamp = signal.timestamp || currentDate
  return deepFreeze({
    id: signal.id || stableId([signal.domain, signal.type, timestamp]), domain: signal.domain, type: signal.type,
    severity: signal.severity || 'medium', value: signal.value ?? null, confidence: Math.max(0, Math.min(1, Number(signal.confidence ?? 0.5))),
    reasons: Array.isArray(signal.reasons) ? [...signal.reasons] : [], timestamp, expiresAt: signal.expiresAt || null,
    goalRelevance: Number(signal.goalRelevance ?? 0.5), potentialBenefit: Number(signal.potentialBenefit ?? 0.5),
    potentialHarm: Number(signal.potentialHarm ?? 0), userPreference: Number(signal.userPreference ?? 0.5), recommendation: signal.recommendation || null,
    metadata: { ...(signal.metadata || {}) },
  })
}

export function validateSignal(signal, now) {
  const errors = []
  if (!signal?.id) errors.push('missing_id')
  if (!DOMAINS.includes(signal?.domain)) errors.push('invalid_domain')
  if (!signal?.type || typeof signal.type !== 'string') errors.push('invalid_type')
  if (!SEVERITIES.includes(signal?.severity)) errors.push('invalid_severity')
  if (!Number.isFinite(signal?.confidence) || signal.confidence < 0 || signal.confidence > 1) errors.push('invalid_confidence')
  if (!signal?.timestamp || Number.isNaN(Date.parse(signal.timestamp))) errors.push('invalid_timestamp')
  const expired = Boolean(signal?.expiresAt && Date.parse(signal.expiresAt) <= Date.parse(now))
  return { valid: errors.length === 0 && !expired, expired, errors }
}

export function createFeedback({ decisionId, type, timestamp, details = null }) {
  if (!decisionId || !FEEDBACK_TYPES.includes(type) || !timestamp) throw new TypeError('Invalid ASKR feedback')
  return deepFreeze({ id: stableId([decisionId, type, timestamp]), decisionId, type, timestamp, details })
}

export function storeFeedback(existingFeedback = [], feedbackInput) {
  const feedback = createFeedback(feedbackInput)
  return deepFreeze([...existingFeedback.filter(item => item.id !== feedback.id), feedback])
}
