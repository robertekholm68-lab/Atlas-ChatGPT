const safetyTypes = new Set(['POSSIBLE_ILLNESS', 'ELEVATED_RESTING_HEART_RATE', 'SUSTAINED_HRV_SUPPRESSION', 'EXTREME_FATIGUE', 'DIZZINESS', 'PAIN', 'VERY_LOW_ENERGY_AVAILABILITY', 'RAPID_WEIGHT_CHANGE'])

export function identifySafetyConstraints(signals = []) {
  return signals.filter(signal => safetyTypes.has(signal.type) || signal.severity === 'critical').map(signal => ({
    id: `safety-${signal.id}`, signalId: signal.id, level: signal.severity === 'critical' ? 'critical' : 'caution',
    recommendation: ['DIZZINESS', 'PAIN', 'POSSIBLE_ILLNESS', 'RAPID_WEIGHT_CHANGE'].includes(signal.type)
      ? 'Pause strenuous activity and consider advice from an appropriate health professional.'
      : 'Prioritize rest and reassess before strenuous activity.',
    languageBoundary: 'wellness_not_diagnosis', blocks: ['START_WORKOUT', 'MODIFY_WORKOUT'],
  }))
}

export function safetyRank(signal) { return safetyTypes.has(signal.type) || signal.severity === 'critical' ? 0 : 1 }
