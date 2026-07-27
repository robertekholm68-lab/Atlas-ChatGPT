const readable = value => value.toLowerCase().replaceAll('_', ' ')
export function explainDecision(decision, depth = 'standard', confidence = decision.confidence) {
  const primary = decision.supportingSignals[0]
  const cautious = confidence.category === 'limited' ? 'Based on limited data, ' : ''
  if (depth === 'brief') return `${cautious}${decision.summary}`
  const value = Number.isFinite(Number(primary?.value)) ? ` (${Math.round(primary.value)})` : ''
  const standard = `${cautious}${decision.summary} This is supported by ${readable(primary?.type || 'available information')}${value}.`
  if (depth === 'standard') return standard
  const conflict = decision.conflictingSignals.length ? ` Conflicting advice was held back to protect today's priority.` : ''
  const limits = confidence.limitingFactors.length ? ` Confidence is limited by ${confidence.limitingFactors.map(readable).join(' and ')}.` : ''
  return `${standard}${conflict}${limits}`
}
