import { createAction, validateAction } from '../askr/ASKRActionEngine.js'
import { COACH_ACTION_TYPES } from './CoachModels.js'
export function parseCoachActions(plan) {
  return (plan.recommendedActions || []).filter(item => COACH_ACTION_TYPES.includes(item?.type)).map(item => createAction(item.type, item.payload || {})).filter(action => validateAction(action).valid)
}
