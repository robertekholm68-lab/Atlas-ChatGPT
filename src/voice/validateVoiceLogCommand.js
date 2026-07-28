export function validateVoiceLogCommand(command, context = {}) {
  const warnings = [...(command?.warnings || [])]
  const current = command?.currentSet || {}
  const next = command?.nextSet || {}
  if (current.weightKg != null && current.weightKg < 0) warnings.push('negative_weight')
  if (current.reps != null && (current.reps < 0 || current.reps > 100)) warnings.push('reps_out_of_range')
  if (current.rpe != null && (current.rpe < 1 || current.rpe > 10)) warnings.push('rpe_out_of_range')
  if (next.weightKg != null && next.weightKg < 0) warnings.push('negative_weight')
  const reference = Number(context.plannedWeightKg ?? context.previousSet?.kg)
  const resultingWeight = next.weightKg ?? (Number.isFinite(reference) && next.weightDeltaKg != null ? reference + next.weightDeltaKg : current.weightKg)
  if (resultingWeight != null && resultingWeight < 0) warnings.push('negative_weight')
  if (Number.isFinite(reference) && resultingWeight != null && Math.abs(resultingWeight - reference) > Math.max(20, reference * 0.3)) warnings.push('extreme_weight_change')
  return { ...command, warnings: [...new Set(warnings)], valid: warnings.length === 0, needsConfirmation: true }
}

