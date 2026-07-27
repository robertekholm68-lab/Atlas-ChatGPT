import { actionForSignal } from './ASKRActionEngine.js'
import { deepFreeze, stableId } from './ASKRModels.js'

const TITLES = { POSSIBLE_ILLNESS: 'Choose recovery today', DIZZINESS: 'Pause strenuous training', PAIN: 'Protect your recovery', LOW_READINESS: 'Reduce today’s load', REDUCE_TRAINING_VOLUME: 'Train with less volume', MUSCLE_OVERLOADED: 'Give overloaded muscles more time', VERY_LOW_ENERGY_AVAILABILITY: 'Support recovery with energy', HYDRATION_LOW: 'Hydrate before training', HEAVY_SESSION_PLANNED: 'Your planned session is supported' }
export function generateDecisions({ active, resolutions, safetyConstraints, context, confidence }) {
  return active.slice(0, 5).map(({ signal, score }, index) => {
    const action = safetyConstraints.some(item => item.signalId === signal.id)
      ? actionForSignal({ ...signal, type: 'LOW_READINESS' }, context) : actionForSignal(signal, context)
    const conflicts = resolutions.filter(item => item.winningRecommendation.id === signal.id).map(item => item.suppressedRecommendation)
    return deepFreeze({
      id: stableId([context.currentDate, signal.id]), timestamp: context.currentDate, category: signal.domain, priority: index + 1,
      title: TITLES[signal.type] || 'Focus on today’s highest-value step', summary: signal.reasons.length ? signal.reasons.map(reason => readable(reason)).join(', ') : readable(signal.type),
      recommendedAction: action, alternativeActions: [], reasons: [...signal.reasons], supportingSignals: [signal], conflictingSignals: conflicts,
      confidence, urgency: signal.severity === 'critical' ? 'immediate' : signal.severity === 'high' ? 'today' : 'normal', validUntil: signal.expiresAt,
      safetyLevel: safetyConstraints.some(item => item.signalId === signal.id) ? 'caution' : 'normal', requiresConfirmation: action.requiresConfirmation,
      stateMutationProposal: action.requiresConfirmation ? { action, status: 'awaiting_confirmation' } : null, score,
    })
  })
}
function readable(value) { return String(value).toLowerCase().replaceAll('_', ' ') }
