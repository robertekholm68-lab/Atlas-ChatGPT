import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGoalProfile, createSuggestedWorkout, explainCoachDecision, makeCoachDecision } from '../src/engines/index.js'
import { exerciseLibrary } from '../src/workoutData.js'

test('GoalEngine returns normalized, explainable targets without generating a workout', () => {
  const profile = buildGoalProfile({ goal: 'hypertrophy', experienceLevel: 'intermediate', trainingDays: 4, availableTime: 50, priorityMuscles: ['lats'], restrictedMuscles: ['chest'], preferredSplit: 'upper' })
  assert.equal(profile.goal, 'hypertrophy')
  assert.equal(profile.priorityMultipliers.lats, 1.25)
  assert.deepEqual(profile.preferredRepRanges.compound, [8, 15])
  assert.equal('exercises' in profile, false)
})

test('CoachDecisionEngine reports insufficient data honestly', () => {
  assert.equal(makeCoachDecision({}).decision, 'insufficient_data')
})

test('CoachDecisionEngine chooses recovery when readiness is low', () => {
  const output = makeCoachDecision({ goalProfile: buildGoalProfile(), recovery: { overallReadiness: 30, muscles: { chest: { recoveryPercentage: 25 }, lats: { recoveryPercentage: 35 } } } })
  assert.equal(output.decision, 'recovery')
  assert.equal(output.recommendation, 'recovery')
  assert.ok(output.avoidMuscles.includes('chest'))
})

test('CoachExplanationEngine renders Swedish and English templates only from decision facts', () => {
  const decision = { decision: 'train', recommendation: 'pull', confidence: 82, focusMuscles: ['lats'], avoidMuscles: [], reasonCodes: ['HIGH_READINESS'] }
  const sv = explainCoachDecision(decision, 'sv')
  const en = explainCoachDecision(decision, 'en')
  assert.match(sv.headline, /Redo/)
  assert.match(en.summary, /Pull/)
  assert.match(sv.supportingPoints.join(' '), /lats/)
})

test('SuggestedWorkoutEngine respects restrictions, duration, ordering, and editability', () => {
  const profile = buildGoalProfile({ goal: 'hypertrophy', equipment: ['barbell', 'cable', 'machine', 'dumbbell'] })
  const workout = createSuggestedWorkout({ exercises: exerciseLibrary, goalProfile: profile, duration: 35, restrictedMuscles: ['chest'], equipment: profile.equipment, focusMuscles: ['lats'], recentWorkouts: [{ exercises: [{ exerciseId: 'seated-row' }] }] })
  assert.equal(workout.editable, true)
  assert.ok(workout.estimatedDuration <= 35)
  assert.ok(workout.exercises.length >= 2)
  assert.equal(workout.exercises.some(item => item.exerciseId === 'bench-press'), false)
  assert.ok(workout.exercises[0].reasonCodes.includes('COMPOUND_FIRST'))
})

test('demo and real histories are accepted without mutating WorkoutSessionModel-shaped input', () => {
  for (const mode of ['demo', 'real']) {
    const session = { mode, exercises: [], startedAt: 1 }
    const before = JSON.stringify(session)
    const decision = makeCoachDecision({ session, workoutHistory: [{ mode, recommendation: 'push', completedAt: '2026-07-20' }], recovery: { overallReadiness: 80, muscles: { lats: { recoveryPercentage: 90 } } }, goalProfile: buildGoalProfile() })
    assert.equal(decision.decision, 'train')
    assert.equal(JSON.stringify(session), before)
  }
})
