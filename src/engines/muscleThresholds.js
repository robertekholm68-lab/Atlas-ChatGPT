export const muscleThresholds = {
  chest: { mev: 8, mav: 16, mrv: 22 },
  'front-delts': { mev: 6, mav: 14, mrv: 20 },
  triceps: { mev: 6, mav: 14, mrv: 18 },
  lats: { mev: 8, mav: 16, mrv: 22 },
  'upper-back': { mev: 8, mav: 18, mrv: 24 },
  biceps: { mev: 6, mav: 14, mrv: 20 },
  quads: { mev: 8, mav: 16, mrv: 22 },
  glutes: { mev: 6, mav: 16, mrv: 24 },
  hamstrings: { mev: 6, mav: 14, mrv: 20 },
  calves: { mev: 6, mav: 16, mrv: 22 },
}

export function getTrainingZone(muscleId, effectiveSets = 0, thresholds = muscleThresholds) {
  const threshold = thresholds[muscleId]
  if (!threshold) return 'unknown'
  if (effectiveSets < threshold.mev) return 'below-mev'
  if (effectiveSets <= threshold.mav) return 'productive'
  if (effectiveSets <= threshold.mrv) return 'high'
  return 'above-mrv'
}

export function getMrvPercentage(muscleId, effectiveSets = 0, thresholds = muscleThresholds) {
  const threshold = thresholds[muscleId]
  if (!threshold || threshold.mrv <= 0) return null
  return Math.round((Math.max(0, effectiveSets) / threshold.mrv) * 100)
}
