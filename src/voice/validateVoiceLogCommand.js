export function validateVoiceLogCommand(command, context = {}) {
  const warnings = [...(command?.warnings || [])]
  const current = command?.currentSet || {}
  const next = command?.nextSet || {}
  if (current.weightKg != null && (current.weightKg < 0 || current.weightKg > 500)) warnings.push('weight_out_of_range')
  if (current.reps != null && (current.reps < 0 || current.reps > 100)) warnings.push('reps_out_of_range')
  if (current.rpe != null && (current.rpe < 1 || current.rpe > 10)) warnings.push('rpe_out_of_range')
  if (next.weightKg != null && (next.weightKg < 0 || next.weightKg > 500)) warnings.push('weight_out_of_range')
  const reference = Number(context.plannedWeight ?? context.plannedWeightKg ?? context.previousSet?.weightKg ?? context.previousSet?.kg)
  const resultingWeight = next.weightKg ?? (Number.isFinite(reference) && next.weightDeltaKg != null ? reference + next.weightDeltaKg : current.weightKg)
  if (resultingWeight != null && (resultingWeight < 0 || resultingWeight > 500)) warnings.push('weight_out_of_range')
  if (Number.isFinite(reference) && resultingWeight != null && Math.abs(resultingWeight - reference) > Math.max(20, reference * 0.3)) warnings.push('extreme_weight_change')
  const uniqueWarnings = [...new Set(warnings)]
  const blockingWarnings = new Set(['unrecognized_command', 'weight_out_of_range', 'reps_out_of_range', 'rpe_out_of_range', 'missing_context_weight'])
  return { ...command, warnings: uniqueWarnings, valid: command?.intent !== 'UnknownIntent' && !uniqueWarnings.some(warning => blockingWarnings.has(warning)), needsConfirmation: true }
}
