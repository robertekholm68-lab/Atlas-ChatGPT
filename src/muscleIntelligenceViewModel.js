import { buildMuscleIntelligence } from './engines/MuscleIntelligence.js'

export const muscleNames = Object.freeze({
  chest: 'Chest',
  'front-delts': 'Front delts',
  triceps: 'Triceps',
  lats: 'Lats',
  'upper-back': 'Upper back',
  biceps: 'Biceps',
  quads: 'Quads',
  glutes: 'Glutes',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
})

const colorVariables = Object.freeze({
  'text-3': 'var(--askr-text-3, #5C5C5C)',
  'text-2': 'var(--askr-text-2, #9A9A9A)',
  'volt-deep': 'var(--askr-volt-deep, #4A5A10)',
  'volt-dim': 'var(--askr-volt-dim, #9BBF00)',
  volt: 'var(--askr-volt, #D4FF00)',
})

function formatLastTrained(value, now) {
  if (!value) return 'Not trained this week'
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - new Date(value).getTime()) / 86400000))
  if (elapsedDays === 0) return 'Today'
  if (elapsedDays === 1) return 'Yesterday'
  return `${elapsedDays} days ago`
}

export function buildMuscleIntelligenceViewModel(sessions, exerciseLibrary, selectedMuscleId, now = new Date()) {
  const intelligence = buildMuscleIntelligence(sessions, exerciseLibrary, now)
  const muscles = Object.entries(intelligence).map(([id, facts]) => ({
    id,
    name: muscleNames[id] ?? id,
    ...facts,
    color: colorVariables[facts.colorToken],
    lastTrainedLabel: formatLastTrained(facts.lastTrained, now),
    zoneLabel: facts.trainingZone.replaceAll('-', ' '),
  })).sort((left, right) => right.effectiveSets - left.effectiveSets || left.name.localeCompare(right.name))

  return {
    muscles,
    selectedMuscle: muscles.find((muscle) => muscle.id === selectedMuscleId) ?? muscles[0] ?? null,
  }
}
