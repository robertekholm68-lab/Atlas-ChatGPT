import { buildVolumeSummary } from './VolumeEngine.js'
import { getMrvPercentage, getTrainingZone, muscleThresholds } from './muscleThresholds.js'

export const muscleUiStates = Object.freeze({
  inactive: { colorToken: 'text-3', glowIntensity: 0 },
  recovered: { colorToken: 'text-2', glowIntensity: 0 },
  stimulated: { colorToken: 'volt-deep', glowIntensity: 0.15 },
  high_load: { colorToken: 'volt-dim', glowIntensity: 0.3 },
  near_mrv: { colorToken: 'volt', glowIntensity: 0.45 },
  recovery_warning: { colorToken: 'volt', glowIntensity: 0.6 },
})

export function getMuscleUiStatus(muscle) {
  const effectiveSets = Number(muscle?.effectiveSets) || 0
  if (effectiveSets <= 0) return 'inactive'
  if ((muscle?.percentageTowardMrv ?? 0) > 100 || muscle?.trainingZone === 'above-mrv') return 'recovery_warning'
  if ((muscle?.percentageTowardMrv ?? 0) >= 90) return 'near_mrv'
  if (muscle?.trainingZone === 'high') return 'high_load'
  if (muscle?.trainingZone === 'productive') return 'stimulated'
  return 'recovered'
}

export function buildMuscleIntelligence(sessions = [], exerciseLibrary = [], now = new Date()) {
  const volumeSummary = buildVolumeSummary(sessions, exerciseLibrary, now)

  return Object.fromEntries(Object.keys(muscleThresholds).map((muscleId) => {
    const summary = volumeSummary.muscles[muscleId] ?? {
      weeklyVolume: 0,
      weeklyEffectiveSets: 0,
      frequency: 0,
      lastTrained: null,
    }
    const facts = {
      weeklyVolume: summary.weeklyVolume,
      effectiveSets: summary.weeklyEffectiveSets,
      frequency: summary.frequency,
      lastTrained: summary.lastTrained,
      trainingZone: getTrainingZone(muscleId, summary.weeklyEffectiveSets),
      percentageTowardMrv: getMrvPercentage(muscleId, summary.weeklyEffectiveSets),
      readiness: null,
      recovery: null,
      recommendation: null,
    }
    const uiStatus = getMuscleUiStatus(facts)
    return [
    muscleId,
    {
      ...facts,
      uiStatus,
      ...muscleUiStates[uiStatus],
    },
  ]}))
}
