const DEFAULT_ACTIVATION = 1
const DEFAULT_FATIGUE_FACTOR = 1
const MIN_EFFECTIVE_REPS = 5
const MAX_EFFECTIVE_REPS = 30
const EFFECTIVE_RPE_FLOOR = 6

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const safeNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

export function calculateTrainingVolume(set = {}) {
  return Math.max(0, safeNumber(set.weight) * safeNumber(set.reps))
}

export function calculateEffectiveSets(set = {}, exercise = {}) {
  const reps = safeNumber(set.reps)
  const rpe = set.rpe == null ? 10 : safeNumber(set.rpe)

  if (reps < MIN_EFFECTIVE_REPS || rpe < EFFECTIVE_RPE_FLOOR) return 0

  const repScore = clamp(reps / MAX_EFFECTIVE_REPS, 0, 1)
  const effortScore = clamp((rpe - EFFECTIVE_RPE_FLOOR) / (10 - EFFECTIVE_RPE_FLOOR), 0, 1)
  const hypertrophyScore = clamp(safeNumber(exercise.exerciseDna?.hypertrophyRating ?? exercise.hypertrophyRating, 3) / 5, 0, 1)

  return Number((0.5 + (repScore * 0.2) + (effortScore * 0.2) + (hypertrophyScore * 0.1)).toFixed(2))
}

export function getExerciseDna(exercise = {}) {
  return {
    movementPattern: exercise.exerciseDna?.movementPattern ?? exercise.movementPattern ?? exercise.pattern ?? 'unknown',
    fatigueFactor: safeNumber(exercise.exerciseDna?.fatigueFactor ?? exercise.fatigueFactor, DEFAULT_FATIGUE_FACTOR),
    hypertrophyRating: safeNumber(exercise.exerciseDna?.hypertrophyRating ?? exercise.hypertrophyRating, 3),
    strengthRating: safeNumber(exercise.exerciseDna?.strengthRating ?? exercise.strengthRating, 3),
    skillRating: safeNumber(exercise.exerciseDna?.skillRating ?? exercise.skillRating, 2),
    equipmentCategory: exercise.exerciseDna?.equipmentCategory ?? exercise.equipmentCategory ?? exercise.equipment ?? 'unknown',
    laterality: exercise.exerciseDna?.laterality ?? exercise.laterality ?? 'bilateral',
  }
}

export function getMuscleActivation(exercise = {}) {
  const primaryWeights = exercise.activationWeights?.primary ?? exercise.primaryActivationWeights
  const secondaryWeights = exercise.activationWeights?.secondary ?? exercise.secondaryActivationWeights
  const activation = {}

  for (const muscleId of exercise.primary ?? []) {
    activation[muscleId] = safeNumber(primaryWeights?.[muscleId], DEFAULT_ACTIVATION)
  }

  for (const muscleId of exercise.secondary ?? []) {
    activation[muscleId] = safeNumber(secondaryWeights?.[muscleId], 0.5)
  }

  return activation
}

export function getFatigueMultiplier(set = {}, exercise = {}) {
  const rpe = set.rpe == null ? 8 : safeNumber(set.rpe)
  const reps = safeNumber(set.reps)
  const dna = getExerciseDna(exercise)
  const effortLoad = 0.75 + (clamp(rpe, 1, 10) / 10) * 0.5
  const repLoad = reps > 12 ? 1.1 : reps < 5 ? 0.85 : 1

  return Number((dna.fatigueFactor * effortLoad * repLoad).toFixed(2))
}

export function evaluateCompletedSet(set = {}, exercise = {}, completedAt = null) {
  const volume = calculateTrainingVolume(set)
  const effectiveSets = calculateEffectiveSets(set, exercise)
  const activation = getMuscleActivation(exercise)
  const fatigueMultiplier = getFatigueMultiplier(set, exercise)

  const weightedMuscleActivation = Object.fromEntries(
    Object.entries(activation).map(([muscleId, weight]) => [
      muscleId,
      {
        activationWeight: weight,
        effectiveSets: Number((effectiveSets * weight).toFixed(2)),
        volume: Number((volume * weight).toFixed(2)),
        fatigueLoad: Number((effectiveSets * weight * fatigueMultiplier).toFixed(2)),
      },
    ])
  )

  return {
    exerciseId: exercise.id ?? set.exerciseId ?? null,
    set,
    completedAt: completedAt ?? set.completedAt ?? null,
    volume,
    effectiveSets,
    weightedMuscleActivation,
    fatigueMultiplier,
    exerciseDna: getExerciseDna(exercise),
  }
}
