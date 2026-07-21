const MUSCLE_ALIASES = {
  Bröst: 'Bröst', Triceps: 'Triceps', Axlar: 'Axlar', Rygg: 'Rygg', Biceps: 'Biceps',
  Ben: 'Framsida lår', 'Framsida lår': 'Framsida lår', Säte: 'Säte', Bål: 'Bål',
  'Baksida lår': 'Baksida lår', Underarmar: 'Underarmar', Vader: 'Vader', Lats: 'Rygg'
}

const RECOVERY_HOURS = 72

export function recoverMuscles(muscles = {}, now = Date.now()) {
  const result = {}
  Object.entries(muscles).forEach(([name, entry]) => {
    const elapsedHours = Math.max(0, (now - new Date(entry.updatedAt).getTime()) / 36e5)
    const recoveredFatigue = (elapsedHours / RECOVERY_HOURS) * 100
    result[name] = {
      fatigue: Math.max(0, Math.round((entry.fatigue - recoveredFatigue) * 10) / 10),
      updatedAt: new Date(now).toISOString()
    }
  })
  return result
}

export function applyWorkoutToRecovery(current = {}, workout, now = Date.now()) {
  const recovered = recoverMuscles(current, now)
  const next = { ...recovered }

  for (const exercise of workout.exercises || []) {
    const completedSets = (exercise.sets || []).filter(set => set.done)
    if (!completedSets.length) continue
    const setLoad = completedSets.reduce((sum, set) => sum + Math.max(0.5, Number(set.rpe || 8) / 8), 0)

    Object.entries(exercise.muscleContribution || {}).forEach(([rawName, share]) => {
      const name = MUSCLE_ALIASES[rawName] || rawName
      const previous = next[name]?.fatigue || 0
      next[name] = {
        fatigue: Math.min(100, Math.round((previous + setLoad * 5 * share) * 10) / 10),
        updatedAt: new Date(now).toISOString()
      }
    })
  }

  return next
}

export function recoveryScore(muscles = {}, now = Date.now()) {
  const values = Object.values(recoverMuscles(muscles, now)).map(item => 100 - item.fatigue)
  if (!values.length) return 100
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}
