import { getExerciseDna, getMuscleActivation } from './ExerciseEngine.js'

const overlaps = (left, right) => left.some(value => right.includes(value))
const patternsOppose = pattern => ({ 'horizontal-push': 'horizontal-pull', 'horizontal-pull': 'horizontal-push', 'vertical-push': 'vertical-pull', 'vertical-pull': 'vertical-push', squat: 'hinge', hinge: 'squat' })[pattern]

export function createSuggestedWorkout(input = {}) {
  const exercises = Array.isArray(input.exercises) ? input.exercises : []
  const restricted = [...new Set([...(input.restrictedMuscles || []), ...(input.avoidMuscles || [])])]
  const equipment = (input.equipment || []).map(value => String(value).toLowerCase())
  const recentIds = new Set((input.recentWorkouts || []).flatMap(workout => (workout.exercises || []).map(exercise => exercise.exerciseId || exercise.id)))
  const duration = Math.max(15, Math.min(120, Number(input.duration) || 45))
  const repRanges = input.goalProfile?.preferredRepRanges || { compound: [6, 12], isolation: [10, 15] }
  const eligible = exercises.filter(exercise => {
    const muscles = Object.keys(getMuscleActivation(exercise))
    const category = String(getExerciseDna(exercise).equipmentCategory).toLowerCase()
    return !overlaps(muscles, restricted) && (!equipment.length || equipment.includes(category))
  }).map(exercise => {
    const dna = getExerciseDna(exercise)
    const muscles = Object.keys(getMuscleActivation(exercise))
    const priority = muscles.some(muscle => input.focusMuscles?.includes(muscle)) ? 20 : 0
    return { exercise, dna, score: priority + (exercise.type === 'Compound' ? 10 : 0) + (recentIds.has(exercise.id) ? -15 : 0) + (input.goalProfile?.goal === 'strength' ? dna.strengthRating : dna.hypertrophyRating) }
  }).sort((a, b) => b.score - a.score || a.exercise.id.localeCompare(b.exercise.id))
  const selected = []
  const budget = duration * 60
  let seconds = 0
  for (const candidate of eligible) {
    const sets = candidate.exercise.type === 'Isolation' ? 2 : 3
    const restSeconds = input.goalProfile?.goal === 'strength' && candidate.exercise.type === 'Compound' ? 150 : candidate.exercise.type === 'Isolation' ? 60 : 90
    const estimated = sets * (45 + restSeconds)
    if (seconds + estimated > budget || selected.length >= 8) continue
    const pattern = candidate.dna.movementPattern
    const hasBalance = !selected.length || selected.some(item => item.movementPattern === patternsOppose(pattern))
    selected.push({ exerciseId: candidate.exercise.id, name: candidate.exercise.name, sets, repRange: candidate.exercise.type === 'Isolation' ? repRanges.isolation : repRanges.compound, restSeconds, movementPattern: pattern, reasonCodes: [candidate.exercise.type === 'Compound' ? 'COMPOUND_FIRST' : 'ACCESSORY_BALANCE', hasBalance ? 'MOVEMENT_BALANCE' : null, recentIds.has(candidate.exercise.id) ? 'RECENT_EXERCISE_FALLBACK' : null].filter(Boolean) })
    seconds += estimated
  }
  selected.sort((a, b) => (b.reasonCodes.includes('COMPOUND_FIRST') ? 1 : 0) - (a.reasonCodes.includes('COMPOUND_FIRST') ? 1 : 0))
  const warnings = [restricted.length && !eligible.length ? 'NO_SAFE_EXERCISES' : null, selected.length < 2 ? 'LIMITED_EXERCISE_SELECTION' : null].filter(Boolean)
  return { title: input.title || 'ASKR Suggested Workout', estimatedDuration: Math.min(duration, Math.max(0, Math.ceil(seconds / 60))), exercises: selected, reasonCodes: ['DURATION_RESPECTED', restricted.length ? 'RESTRICTIONS_APPLIED' : null].filter(Boolean), warnings, editable: true }
}

export const generateSuggestedWorkout = createSuggestedWorkout
