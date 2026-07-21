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

function setStimulus(set) {
  const rpe = Math.min(10, Math.max(5, Number(set.rpe) || 8))
  const reps = Math.max(1, Number(set.reps) || 1)
  const effort = 0.65 + ((rpe - 5) / 5) * 0.75
  const repetitionFactor = Math.min(1.25, 0.7 + reps / 20)
  return effort * repetitionFactor
}

export function applyWorkoutToRecovery(current = {}, workout, now = Date.now()) {
  const workoutTime = new Date(workout.completedAt || workout.date || now).getTime()
  const calculationTime = Number.isFinite(workoutTime) ? workoutTime : now
  const recovered = recoverMuscles(current, calculationTime)
  const next = { ...recovered }

  for (const exercise of workout.exercises || []) {
    const completedSets = (exercise.sets || []).filter(set => set.done !== false)
    if (!completedSets.length) continue

    const totalStimulus = completedSets.reduce((sum, set) => sum + setStimulus(set), 0)

    Object.entries(exercise.muscleContribution || {}).forEach(([rawName, share]) => {
      const name = MUSCLE_ALIASES[rawName] || rawName
      const previous = next[name]?.fatigue || 0
      const addedFatigue = totalStimulus * 5.5 * Number(share || 0)
      next[name] = {
        fatigue: Math.min(100, Math.round((previous + addedFatigue) * 10) / 10),
        updatedAt: new Date(calculationTime).toISOString()
      }
    })
  }

  return calculationTime === now ? next : recoverMuscles(next, now)
}

export function recoveryScore(muscles = {}, now = Date.now()) {
  const values = Object.values(recoverMuscles(muscles, now)).map(item => 100 - item.fatigue)
  if (!values.length) return 100
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}
