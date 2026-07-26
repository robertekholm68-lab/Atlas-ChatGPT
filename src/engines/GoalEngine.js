export const SUPPORTED_GOALS = Object.freeze(['general_fitness', 'hypertrophy', 'strength', 'fat_loss', 'maintenance'])

const GOAL_RULES = Object.freeze({
  general_fitness: { reps: [6, 12], volume: 'moderate', intensity: 'moderate', multiplier: 1.1 },
  hypertrophy: { reps: [8, 15], volume: 'high', intensity: 'moderate', multiplier: 1.25 },
  strength: { reps: [3, 6], volume: 'moderate', intensity: 'high', multiplier: 1.2 },
  fat_loss: { reps: [8, 15], volume: 'moderate', intensity: 'moderate', multiplier: 1.1 },
  maintenance: { reps: [6, 12], volume: 'low', intensity: 'moderate', multiplier: 1 },
})

const unique = value => [...new Set(Array.isArray(value) ? value.filter(Boolean).map(String) : [])]
const positiveInteger = (value, fallback, maximum) => Math.min(maximum, Math.max(1, Math.round(Number(value) || fallback)))

export function buildGoalProfile(input = {}) {
  const goal = SUPPORTED_GOALS.includes(input.goal) ? input.goal : 'general_fitness'
  const priorityMuscles = unique(input.priorityMuscles)
  const restrictedMuscles = unique(input.restrictedMuscles)
  const rules = GOAL_RULES[goal]
  const trainingDays = positiveInteger(input.trainingDays, 3, 7)
  const availableTime = positiveInteger(input.availableTime, 45, 180)
  const experienceLevel = ['beginner', 'intermediate', 'advanced'].includes(input.experienceLevel) ? input.experienceLevel : 'beginner'
  const experienceVolume = { beginner: 0.85, intermediate: 1, advanced: 1.1 }[experienceLevel]

  return Object.freeze({
    goal,
    experienceLevel,
    trainingDays,
    availableTime,
    priorityMuscles,
    restrictedMuscles,
    preferredSplit: input.preferredSplit || (trainingDays <= 3 ? 'full_body' : 'upper_lower'),
    equipment: unique(input.equipment),
    priorityMultipliers: Object.fromEntries(priorityMuscles.map(muscle => [muscle, restrictedMuscles.includes(muscle) ? 0 : rules.multiplier])),
    preferredRepRanges: { compound: [...rules.reps], isolation: [Math.max(8, rules.reps[0]), Math.max(12, rules.reps[1])] },
    volumeTarget: { level: rules.volume, weeklySetsPerMuscle: Math.round(({ low: 8, moderate: 12, high: 16 }[rules.volume]) * experienceVolume) },
    intensityTarget: { level: rules.intensity, targetRpe: rules.intensity === 'high' ? [8, 9] : [7, 8] },
  })
}

export const evaluateGoal = buildGoalProfile
