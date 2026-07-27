import { COACH_INTENTS } from './CoachModels.js'

const DOMAINS = {
  [COACH_INTENTS.EXPLAIN_TODAY]: ['decisions', 'recovery', 'training'], [COACH_INTENTS.SUGGEST_WORKOUT]: ['training', 'muscles', 'recovery', 'profile'],
  [COACH_INTENTS.MODIFY_WORKOUT]: ['training', 'muscles', 'recovery', 'profile'], [COACH_INTENTS.REPLACE_EXERCISE]: ['training', 'muscles', 'recovery', 'profile'],
  [COACH_INTENTS.CREATE_WORKOUT_PLAN]: ['training', 'muscles', 'recovery', 'profile'], [COACH_INTENTS.REVIEW_RECOVERY]: ['recovery', 'health'],
  [COACH_INTENTS.REVIEW_NUTRITION]: ['nutrition', 'goals', 'training'], [COACH_INTENTS.LOG_MEAL]: ['nutrition'], [COACH_INTENTS.LOG_WATER]: ['nutrition'],
  [COACH_INTENTS.REVIEW_PROGRESS]: ['progress', 'goals', 'bodyTrends'], [COACH_INTENTS.ADJUST_GOAL]: ['goals', 'progress'],
  [COACH_INTENTS.PLAN_WEEK]: ['training', 'recovery', 'goals', 'profile'], [COACH_INTENTS.REPORT_SYMPTOM]: ['safety', 'training'],
  [COACH_INTENTS.CORRECT_DATA]: ['dataQuality'], [COACH_INTENTS.REJECT_RECOMMENDATION]: ['decisions'], [COACH_INTENTS.GENERAL_FITNESS]: [], [COACH_INTENTS.UNKNOWN]: [],
}
const SAFE_PROFILE_KEYS = ['trainingExperience', 'availableEquipment', 'typicalWorkoutDuration', 'foodPreferences']
function summarize(domain, value) {
  if (!value) return null
  if (domain === 'profile') return Object.fromEntries(SAFE_PROFILE_KEYS.filter(key => value[key] != null).map(key => [key, value[key]]))
  if (Array.isArray(value)) return { count: value.length, recent: value.slice(-3).map(({ id, name, type, date, status }) => ({ id, name, type, date, status })) }
  if (typeof value !== 'object') return value
  const blocked = /name|email|phone|address|medicalNotes|raw|history/i
  return Object.fromEntries(Object.entries(value).filter(([key]) => !blocked.test(key)).slice(0, 12))
}
export function requiredContextDomains(intent) { return [...(DOMAINS[intent] || [])] }
export function buildCoachContext(intent, applicationState = {}, decisions = []) {
  const context = { intent, decisions: decisions.map(({ id, domain, recommendation, confidence, safety }) => ({ id, domain, recommendation, confidence, safety })) }
  requiredContextDomains(intent).filter(domain => domain !== 'decisions').forEach(domain => { const summary = summarize(domain, applicationState[domain]); if (summary != null) context[domain] = summary })
  return Object.freeze(context)
}
