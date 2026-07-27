import { COACH_INTENTS } from './CoachModels.js'

const RULES = [
  [COACH_INTENTS.REPORT_SYMPTOM, /\b(pain(?:ful)?|hurt(?:s|ing)?|injur(?:y|ed)?|dizz(?:y|iness)|faint(?:ing)?|chest|symptom(?:s)?|sick|ill(?:ness)?)\b/i, .98],
  [COACH_INTENTS.LOG_WATER, /\b(log|add|track).{0,15}\b(water|hydration)\b/i, .95],
  [COACH_INTENTS.LOG_MEAL, /\b(log|add|track).{0,15}\b(meal|food|breakfast|lunch|dinner)\b/i, .95],
  [COACH_INTENTS.REPLACE_EXERCISE, /\b(replace|swap).{0,30}\b(exercise|press|squat|lift|curl|row)\b/i, .94],
  [COACH_INTENTS.MODIFY_WORKOUT, /\b(easier|harder|shorter|modify|change).{0,25}\b(workout|session|training)\b/i, .92],
  [COACH_INTENTS.CREATE_WORKOUT_PLAN, /\b(make|create|build).{0,30}\b(workout|plan|session)\b/i, .93],
  [COACH_INTENTS.SUGGEST_WORKOUT, /\b(suggest|recommend|what).{0,25}\b(workout|train|session)\b/i, .88],
  [COACH_INTENTS.REVIEW_RECOVERY, /\b(recovery|readiness|sleep|fatigue)\b/i, .87],
  [COACH_INTENTS.REVIEW_NUTRITION, /\b(nutrition|protein|calorie|eat|meal)\b/i, .86],
  [COACH_INTENTS.REVIEW_PROGRESS, /\b(progress|trend|improving|strength)\b/i, .86],
  [COACH_INTENTS.ADJUST_GOAL, /\b(adjust|change|update).{0,20}\bgoal|target\b/i, .92],
  [COACH_INTENTS.PLAN_WEEK, /\b(plan|schedule|prepare).{0,20}\bweek\b/i, .9],
  [COACH_INTENTS.EXPLAIN_TODAY, /\b(explain|why).{0,30}\b(today|recommendation|decision)\b/i, .91],
  [COACH_INTENTS.CORRECT_DATA, /\b(wrong|incorrect|correct).{0,20}\b(data|entry|logged|record)\b/i, .91],
  [COACH_INTENTS.REJECT_RECOMMENDATION, /\b(reject|decline|don't want|no thanks)\b/i, .88],
  [COACH_INTENTS.GENERAL_FITNESS, /\b(fitness|exercise|training|health)\b/i, .7],
]
export function classifyCoachIntent(message = '') {
  const text = String(message).trim()
  const match = RULES.find(([, pattern]) => pattern.test(text))
  return Object.freeze({ intent: match?.[0] || COACH_INTENTS.UNKNOWN, confidence: match?.[2] || 0.2, requiresClarification: !match || match[2] < 0.65 })
}
