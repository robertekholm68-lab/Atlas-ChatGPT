import { evaluateWorkoutSessions } from './MuscleEngine.js'

export function trackWeeklyVolume(sessions = [], exerciseLibrary = [], now = new Date()) {
  return evaluateWorkoutSessions(sessions, exerciseLibrary, now)
}

export function aggregateEffectiveSets(muscleSummaries = {}) {
  return Object.values(muscleSummaries).reduce((total, muscle) => total + (muscle.weeklyEffectiveSets ?? 0), 0)
}

export function buildVolumeSummary(sessions = [], exerciseLibrary = [], now = new Date()) {
  const muscles = trackWeeklyVolume(sessions, exerciseLibrary, now)
  const totalWeeklyVolume = Object.values(muscles).reduce((total, muscle) => total + muscle.weeklyVolume, 0)
  const totalEffectiveSets = aggregateEffectiveSets(muscles)

  return {
    weekEnding: new Date(now).toISOString(),
    totalWeeklyVolume: Number(totalWeeklyVolume.toFixed(2)),
    totalEffectiveSets: Number(totalEffectiveSets.toFixed(2)),
    muscles,
  }
}
