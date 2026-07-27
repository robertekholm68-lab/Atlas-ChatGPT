export const COACH_INTENTS = Object.freeze({
  EXPLAIN_TODAY: 'EXPLAIN_TODAY', SUGGEST_WORKOUT: 'SUGGEST_WORKOUT', MODIFY_WORKOUT: 'MODIFY_WORKOUT',
  REPLACE_EXERCISE: 'REPLACE_EXERCISE', CREATE_WORKOUT_PLAN: 'CREATE_WORKOUT_PLAN', REVIEW_RECOVERY: 'REVIEW_RECOVERY',
  REVIEW_NUTRITION: 'REVIEW_NUTRITION', LOG_MEAL: 'LOG_MEAL', LOG_WATER: 'LOG_WATER', REVIEW_PROGRESS: 'REVIEW_PROGRESS',
  ADJUST_GOAL: 'ADJUST_GOAL', PLAN_WEEK: 'PLAN_WEEK', GENERAL_FITNESS: 'GENERAL_FITNESS', REPORT_SYMPTOM: 'REPORT_SYMPTOM',
  CORRECT_DATA: 'CORRECT_DATA', REJECT_RECOMMENDATION: 'REJECT_RECOMMENDATION', UNKNOWN: 'UNKNOWN',
})

export const COACH_ACTION_TYPES = Object.freeze(['ADD_EXERCISE', 'REMOVE_EXERCISE', 'SWAP_EXERCISE', 'START_WORKOUT', 'LOG_WATER', 'CREATE_MEAL_DRAFT', 'UPDATE_GOAL_PROPOSAL', 'CREATE_WEEK_PLAN'])

export function createResponsePlan(input) {
  return Object.freeze({ intent: input.intent, directAnswer: input.directAnswer || '', explanationPoints: [...(input.explanationPoints || [])],
    recommendedActions: [...(input.recommendedActions || [])], warnings: [...(input.warnings || [])], followUpQuestion: input.followUpQuestion || null,
    tone: input.tone || 'balanced', confidence: Math.max(0, Math.min(1, Number(input.confidence ?? 0))), sourceDecisions: [...(input.sourceDecisions || [])] })
}
