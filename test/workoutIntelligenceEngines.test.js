import test from 'node:test'
import assert from 'node:assert/strict'

import { exerciseLibrary } from '../src/workoutData.js'
import {
  aggregateEffectiveSets,
  aggregateEvaluatedSets,
  buildMuscleIntelligence,
  buildVolumeSummary,
  calculateEffectiveSets,
  calculateTrainingVolume,
  evaluateCompletedSet,
  evaluateWorkoutSessions,
  getExerciseDna,
  getFatigueMultiplier,
  getMrvPercentage,
  getMuscleActivation,
  getTrainingZone,
  muscleThresholds,
  trackWeeklyVolume,
} from '../src/engines/index.js'

const benchPress = exerciseLibrary.find((exercise) => exercise.id === 'bench-press')
const seatedRow = exerciseLibrary.find((exercise) => exercise.id === 'seated-row')
const now = new Date('2026-07-24T12:00:00.000Z')
const sessions = [
  {
    completedAt: '2026-07-23T10:00:00.000Z',
    exercises: [
      { exerciseId: 'bench-press', sets: [{ weight: 100, reps: 8, rpe: 9 }] },
      { exerciseId: 'seated-row', sets: [{ weight: 80, reps: 10, rpe: 8 }] },
    ],
  },
  {
    completedAt: '2026-07-20T10:00:00.000Z',
    exercises: [
      { exerciseId: 'bench-press', sets: [{ weight: 90, reps: 6, rpe: 8 }] },
    ],
  },
  {
    completedAt: '2026-07-01T10:00:00.000Z',
    exercises: [
      { exerciseId: 'bench-press', sets: [{ weight: 200, reps: 10, rpe: 10 }] },
    ],
  },
]

test('ExerciseEngine calculates set volume safely', () => {
  assert.equal(calculateTrainingVolume({ weight: 100, reps: 8 }), 800)
  assert.equal(calculateTrainingVolume({ weight: -100, reps: 8 }), 0)
  assert.equal(calculateTrainingVolume({ weight: 'bad', reps: 8 }), 0)
})

test('ExerciseEngine calculates effective sets from reps effort and exercise metadata', () => {
  assert.equal(calculateEffectiveSets({ reps: 8, rpe: 9 }, benchPress), 0.8)
  assert.equal(calculateEffectiveSets({ reps: 4, rpe: 10 }, benchPress), 0)
  assert.equal(calculateEffectiveSets({ reps: 12, rpe: 5 }, benchPress), 0)
})

test('ExerciseEngine returns weighted muscle activation and Exercise DNA metadata', () => {
  assert.deepEqual(getMuscleActivation(benchPress), { chest: 1, 'front-delts': 0.55, triceps: 0.65 })
  assert.deepEqual(getExerciseDna(benchPress), {
    movementPattern: 'horizontal-push',
    fatigueFactor: 1.15,
    hypertrophyRating: 5,
    strengthRating: 5,
    skillRating: 3,
    equipmentCategory: 'barbell',
    laterality: 'bilateral',
  })
})

test('ExerciseEngine evaluates a completed set without mutating inputs', () => {
  const set = { weight: 100, reps: 8, rpe: 9 }
  const before = JSON.stringify(set)
  const evaluated = evaluateCompletedSet(set, benchPress, '2026-07-23T10:00:00.000Z')

  assert.equal(evaluated.volume, 800)
  assert.equal(evaluated.effectiveSets, 0.8)
  assert.equal(evaluated.weightedMuscleActivation.chest.volume, 800)
  assert.equal(evaluated.weightedMuscleActivation.triceps.effectiveSets, 0.52)
  assert.equal(evaluated.fatigueMultiplier, getFatigueMultiplier(set, benchPress))
  assert.equal(JSON.stringify(set), before)
})

test('MuscleEngine aggregates evaluated sets by muscle', () => {
  const evaluatedSets = [
    evaluateCompletedSet({ weight: 100, reps: 8, rpe: 9 }, benchPress, '2026-07-23T10:00:00.000Z'),
    evaluateCompletedSet({ weight: 90, reps: 6, rpe: 8 }, benchPress, '2026-07-20T10:00:00.000Z'),
  ]
  const muscles = aggregateEvaluatedSets(evaluatedSets)

  assert.equal(muscles.chest.weeklyVolume, 1340)
  assert.equal(muscles.chest.weeklyEffectiveSets, 1.54)
  assert.equal(muscles.chest.frequency, 2)
  assert.equal(muscles.chest.lastTrained, '2026-07-23T10:00:00.000Z')
})

test('MuscleEngine reuses workout session model and ignores sessions outside the current week', () => {
  const muscles = evaluateWorkoutSessions(sessions, exerciseLibrary, now)

  assert.equal(muscles.chest.weeklyVolume, 1340)
  assert.equal(muscles['upper-back'].weeklyVolume, 800)
  assert.equal(muscles.chest.frequency, 2)
})

test('VolumeEngine tracks weekly volume and structured totals', () => {
  const tracked = trackWeeklyVolume(sessions, exerciseLibrary, now)
  const summary = buildVolumeSummary(sessions, exerciseLibrary, now)

  assert.equal(tracked.chest.weeklyVolume, 1340)
  assert.equal(Number(aggregateEffectiveSets(tracked).toFixed(2)), summary.totalEffectiveSets)
  assert.equal(summary.totalWeeklyVolume, 4788)
  assert.equal(summary.weekEnding, now.toISOString())
})

test('muscleThresholds returns zones and MRV percentages for major muscles', () => {
  assert.deepEqual(Object.keys(muscleThresholds).sort(), ['biceps', 'calves', 'chest', 'front-delts', 'glutes', 'hamstrings', 'lats', 'quads', 'triceps', 'upper-back'].sort())
  assert.equal(getTrainingZone('chest', 4), 'below-mev')
  assert.equal(getTrainingZone('chest', 12), 'productive')
  assert.equal(getTrainingZone('chest', 20), 'high')
  assert.equal(getTrainingZone('chest', 24), 'above-mrv')
  assert.equal(getTrainingZone('unknown', 10), 'unknown')
  assert.equal(getMrvPercentage('chest', 11), 50)
  assert.equal(getMrvPercentage('unknown', 10), null)
})

test('MuscleIntelligence returns structured facts only with placeholders', () => {
  const intelligence = buildMuscleIntelligence(sessions, exerciseLibrary, now)

  assert.equal(intelligence.chest.weeklyVolume, 1340)
  assert.equal(intelligence.chest.effectiveSets, 1.54)
  assert.equal(intelligence.chest.trainingZone, 'below-mev')
  assert.equal(intelligence.chest.recovery, null)
  assert.equal(intelligence.chest.recommendation, null)
  assert.ok(!('reasoning' in intelligence.chest))
})

test('engines handle empty and unknown data safely', () => {
  assert.deepEqual(evaluateWorkoutSessions([], exerciseLibrary, now), {})
  assert.deepEqual(buildMuscleIntelligence([], exerciseLibrary, now), {})
  assert.deepEqual(getMuscleActivation({ primary: ['calves'], secondary: ['unknown'] }), { calves: 1, unknown: 0.5 })
  assert.equal(evaluateWorkoutSessions([{ completedAt: now.toISOString(), exercises: [{ exerciseId: 'missing', sets: [{ weight: 1, reps: 10, rpe: 10 }] }] }], exerciseLibrary, now).missing, undefined)
})
