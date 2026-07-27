import { inspectCoachResponse } from '../../engines/coach/CoachGuardrailEngine.js'
export function validateAIResponse(text, plan, constraints = {}) {
  const safety = inspectCoachResponse(text, constraints)
  const missingDirectAnswer = Boolean(plan.directAnswer && !String(text).toLowerCase().includes(plan.directAnswer.toLowerCase()))
  return { valid: safety.valid && !missingDirectAnswer, errors: [...safety.errors, ...(missingDirectAnswer ? ['response_does_not_conform_to_plan'] : [])] }
}
