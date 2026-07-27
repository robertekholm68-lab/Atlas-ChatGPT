import { buildASKRContext } from './ASKRContextEngine.js'
import { createSignal, validateSignal, ASKR_ENGINE_VERSION, ASKR_CONTEXT_VERSION, deepFreeze } from './ASKRModels.js'
import { identifySafetyConstraints } from './ASKRSafetyEngine.js'
import { rankSignals } from './ASKRPriorityEngine.js'
import { resolveConflicts } from './ASKRConflictResolver.js'
import { calculateConfidence } from './ASKRConfidenceEngine.js'
import { generateDecisions } from './ASKRDecisionEngine.js'
import { explainDecision } from './ASKRExplanationEngine.js'
import { generateInsights } from './ASKRInsightEngine.js'
import { selectDailyBriefing, selectNextBestAction } from './ASKRSelectors.js'

export function runASKRIntelligence(input = {}) {
  const context = buildASKRContext(input)
  const evaluated = context.domainSignals.map(signal => createSignal(signal, context.currentDate))
  const validations = evaluated.map(signal => ({ signal, validation: validateSignal(signal, context.currentDate) }))
  const signals = validations.filter(item => item.validation.valid).map(item => item.signal)
  const rejected = validations.filter(item => !item.validation.valid)
  const safetyConstraints = identifySafetyConstraints(signals)
  const priorityResults = rankSignals(signals, context)
  const conflicts = resolveConflicts(priorityResults)
  const confidence = calculateConfidence({ context, signals: conflicts.active.map(item => item.signal) })
  const decisions = generateDecisions({ ...conflicts, safetyConstraints, context, confidence })
  const explanations = Object.fromEntries(decisions.map(decision => [decision.id, { brief: explainDecision(decision, 'brief', confidence), standard: explainDecision(decision, 'standard', confidence), detailed: explainDecision(decision, 'detailed', confidence) }]))
  const briefing = selectDailyBriefing(decisions, context, explanations)
  const trace = { contextVersion: ASKR_CONTEXT_VERSION, signalsEvaluated: evaluated.map(item => item.id), signalsRejected: rejected.map(item => ({ id: item.signal.id, ...item.validation })), priorityResults: priorityResults.map(item => ({ id: item.signal.id, score: item.score, safetyTier: item.safetyTier })), conflictsResolved: conflicts.resolutions, safetyConstraints, finalDecisions: decisions.map(item => item.id), confidenceInputs: confidence, engineVersions: { askr: ASKR_ENGINE_VERSION } }
  return deepFreeze({ context, decisions, briefing, nextBestAction: selectNextBestAction(briefing, context), insights: generateInsights(context), explanations, trace })
}
