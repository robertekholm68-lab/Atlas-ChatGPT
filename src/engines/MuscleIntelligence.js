import { buildVolumeSummary } from './VolumeEngine.js'
import { getMrvPercentage, getTrainingZone } from './muscleThresholds.js'

export function buildMuscleIntelligence(sessions = [], exerciseLibrary = [], now = new Date()) {
  const volumeSummary = buildVolumeSummary(sessions, exerciseLibrary, now)

  return Object.fromEntries(Object.entries(volumeSummary.muscles).map(([muscleId, summary]) => [
    muscleId,
    {
      weeklyVolume: summary.weeklyVolume,
      effectiveSets: summary.weeklyEffectiveSets,
      frequency: summary.frequency,
      lastTrained: summary.lastTrained,
      trainingZone: getTrainingZone(muscleId, summary.weeklyEffectiveSets),
      percentageTowardMrv: getMrvPercentage(muscleId, summary.weeklyEffectiveSets),
      recovery: null,
      recommendation: null,
    },
  ]))
}
