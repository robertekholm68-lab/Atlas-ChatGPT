const CATEGORIES = new Set(['workout_time', 'exercise_dislike', 'food_dislike', 'schedule', 'explanation_preference', 'recurring_constraint', 'coaching_style'])
export function createCoachMemory(input, now = new Date().toISOString()) {
  if (!input?.userConfirmed || !CATEGORIES.has(input.category)) throw new TypeError('Coach memory requires a confirmed, supported preference')
  return Object.freeze({ id: input.id || `memory-${Date.parse(now)}-${input.category}`, value: input.value, source: input.source || 'conversation', timestamp: now, confidence: Math.max(0, Math.min(1, Number(input.confidence ?? 1))), userConfirmed: true, category: input.category })
}
export function removeCoachMemory(memories, id) { return memories.filter(memory => memory.id !== id) }
export function summarizeConversationMemory(proposal) { return proposal?.userConfirmed ? createCoachMemory(proposal) : null }
