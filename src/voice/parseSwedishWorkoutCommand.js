import { CancelMatcher } from './parser/matchers/CancelMatcher.js'
import { CompletionMatcher } from './parser/matchers/CompletionMatcher.js'
import { NextSetMatcher } from './parser/matchers/NextSetMatcher.js'
import { NaturalGymLanguageMatcher } from './parser/matchers/NaturalGymLanguageMatcher.js'
import { RepMatcher } from './parser/matchers/RepMatcher.js'
import { RPEMatcher } from './parser/matchers/RPEMatcher.js'
import { UnknownMatcher } from './parser/matchers/UnknownMatcher.js'
import { WeightAdjustmentMatcher } from './parser/matchers/WeightAdjustmentMatcher.js'
import { WeightMatcher } from './parser/matchers/WeightMatcher.js'
import { contextWeight, normalizeTranscript } from './parser/parserUtils.js'

export { parseSwedishNumber } from './parser/numberParser.js'

const EMPTY_CURRENT_SET = Object.freeze({ weightKg: null, reps: null, rpe: null, completed: false })
const EMPTY_NEXT_SET = Object.freeze({ weightKg: null, weightDeltaKg: null })

function emptyResult(transcript) {
  return { transcript: String(transcript ?? ''), intent: 'UnknownIntent', currentSet: { ...EMPTY_CURRENT_SET }, nextSet: { ...EMPTY_NEXT_SET }, confidence: 0, needsConfirmation: true, warnings: ['unrecognized_command'] }
}

function addValidated(target, key, value, minimum, maximum, warning, warnings) {
  if (value == null) return
  if (!Number.isFinite(value) || value < minimum || value > maximum) warnings.push(warning)
  else target[key] = value
}

export function parseSwedishWorkoutCommand(transcript, workoutContext = {}) {
  const text = normalizeTranscript(transcript)
  if (!text) return emptyResult(transcript)
  const cancel = CancelMatcher.match({ text })
  if (cancel) return { ...emptyResult(transcript), intent: 'cancel', confidence: 1, warnings: [] }
  const natural = NaturalGymLanguageMatcher.match({ text, context: workoutContext })
  if (natural) {
    const warnings = natural.warning ? [natural.warning] : []
    const currentSet = { ...EMPTY_CURRENT_SET, weightKg: natural.weightKg ?? null, reps: natural.reps ?? null, rpe: natural.rpe ?? null, completed: Boolean(natural.completed) }
    return { transcript: String(transcript ?? ''), intent: natural.intent, currentSet, nextSet: { ...EMPTY_NEXT_SET }, setCount: natural.setCount, copyPrevious: natural.copyPrevious, confidence: warnings.length ? 0.45 : 0.96, needsConfirmation: true, warnings }
  }

  const next = NextSetMatcher.match({ text })
  const adjustment = WeightAdjustmentMatcher.match({ text })
  const targetsNext = Boolean(next || adjustment?.targetsNext)
  const rpe = RPEMatcher.match({ text })
  const weight = WeightMatcher.match({ text, context: workoutContext, targetsNext })
  const completion = CompletionMatcher.match({ text })
  const hasSpecializedMatch = Boolean(adjustment || rpe || weight || completion)
  const reps = RepMatcher.match({ text, targetsNext, hasSpecializedMatch })
  if (!hasSpecializedMatch && !reps && !next) return emptyResult(transcript)

  const warnings = []
  const currentSet = { ...EMPTY_CURRENT_SET }
  const nextSet = { ...EMPTY_NEXT_SET }
  addValidated(currentSet, 'weightKg', weight?.weightKg, 0, 500, 'weight_out_of_range', warnings)
  addValidated(currentSet, 'reps', reps?.reps, 0, 100, 'reps_out_of_range', warnings)
  addValidated(currentSet, 'rpe', rpe?.rpe, 1, 10, 'rpe_out_of_range', warnings)
  addValidated(nextSet, 'weightKg', weight?.nextWeightKg, 0, 500, 'weight_out_of_range', warnings)
  if (adjustment?.weightDeltaKg != null) nextSet.weightDeltaKg = adjustment.weightDeltaKg
  currentSet.completed = Boolean(completion?.completed || reps?.completed || (next && !adjustment && !weight))

  const baseWeight = contextWeight(workoutContext)
  if (currentSet.reps != null && currentSet.weightKg == null && baseWeight != null) currentSet.weightKg = baseWeight
  const resultingNextWeight = nextSet.weightKg ?? (baseWeight != null && nextSet.weightDeltaKg != null ? baseWeight + nextSet.weightDeltaKg : null)
  if (resultingNextWeight != null && (resultingNextWeight < 0 || resultingNextWeight > 500)) {
    warnings.push('weight_out_of_range')
    nextSet.weightKg = null
    nextSet.weightDeltaKg = null
  } else if (baseWeight != null && resultingNextWeight != null && Math.abs(resultingNextWeight - baseWeight) > Math.max(20, baseWeight * 0.3)) warnings.push('extreme_weight_change')
  if (weight?.sameWeight && (weight.weightKg == null && weight.nextWeightKg == null)) warnings.push('missing_context_weight')
  if (reps?.ambiguous) warnings.push('ambiguous_number')

  const parsedFields = [currentSet.weightKg, currentSet.reps, currentSet.rpe, nextSet.weightKg, nextSet.weightDeltaKg].filter(value => value != null).length
  const intent = next && !adjustment && !weight ? 'next_set' : targetsNext ? 'update_next_set' : 'log_set'
  return { transcript: String(transcript ?? ''), intent, currentSet, nextSet, confidence: Math.min(0.99, 0.78 + parsedFields * 0.06 + (currentSet.completed ? 0.05 : 0)), needsConfirmation: true, warnings: [...new Set(warnings)] }
}

export const workoutCommandMatchers = Object.freeze([CancelMatcher, NaturalGymLanguageMatcher, RPEMatcher, WeightAdjustmentMatcher, WeightMatcher, RepMatcher, CompletionMatcher, NextSetMatcher, UnknownMatcher])
