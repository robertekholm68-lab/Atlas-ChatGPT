const at = '2026-07-27T08:00:00.000Z'
const signal = (domain, type, extra = {}) => ({ domain, type, severity: 'medium', confidence: 0.8, reasons: [type.toLowerCase()], timestamp: at, expiresAt: '2026-07-28T08:00:00.000Z', ...extra })
const base = { currentDate: at, availableTime: 45, trainingHistory: [], currentWorkoutPlan: { id: 'workout-1', duration: 45 }, domainSignals: [] }
export const askrScenarios = {
  excellentRecovery: { ...base, recoveryStatus: { readiness: 91 }, domainSignals: [signal('training', 'HEAVY_SESSION_PLANNED', { severity: 'high', value: 91, confidence: 0.94 })] },
  poorSleepLowFatigue: { ...base, domainSignals: [signal('recovery', 'LOW_READINESS', { value: 55, reasons: ['poor_sleep'] })] },
  motivatedExcessiveLoad: { ...base, domainSignals: [signal('recovery', 'REDUCE_TRAINING_VOLUME', { severity: 'high' }), signal('behavior', 'HIGH_MOTIVATION')] },
  deficitRecoveryConflict: { ...base, domainSignals: [signal('nutrition', 'MAINTAIN_CALORIE_DEFICIT'), signal('recovery', 'VERY_LOW_ENERGY_AVAILABILITY', { severity: 'high' })] },
  strongProgressLowConsistency: { ...base, domainSignals: [signal('progress', 'STRONG_PROGRESS'), signal('behavior', 'LOW_CONSISTENCY')] },
  manualOnly: { ...base, recoveryStatus: { source: 'manual', readiness: 68 }, dataQuality: { recovery: 'good' }, domainSignals: [signal('recovery', 'LOW_READINESS', { confidence: 0.65 })] },
  missingNutrition: { ...base, domainSignals: [signal('nutrition', 'MISSING_NUTRITION_DATA', { confidence: 0.5 })] },
  possibleIllness: { ...base, domainSignals: [signal('health', 'POSSIBLE_ILLNESS', { severity: 'critical', reasons: ['elevated_resting_heart_rate', 'extreme_fatigue'] }), signal('training', 'HEAVY_SESSION_PLANNED', { severity: 'high' })] },
  overloadedLegs: { ...base, muscleStatus: { quadriceps: 34, upperBody: 88 }, domainSignals: [signal('muscles', 'MUSCLE_OVERLOADED', { severity: 'high' }), signal('training', 'HEAVY_SESSION_PLANNED')] },
  twentyMinutes: { ...base, availableTime: 20, currentWorkoutPlan: { id: 'workout-1', duration: 45 }, domainSignals: [signal('recovery', 'LOW_READINESS')] },
  rejectedRest: { ...base, userFeedback: [{ decisionId: 'rest-1', type: 'CANNOT_DO_TODAY', timestamp: at }], domainSignals: [signal('recovery', 'LOW_READINESS')] },
}
