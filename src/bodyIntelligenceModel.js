import { buildMuscleHistory, buildMuscleIntelligence, buildRecoveryIntelligence, buildGoalProfile, explainCoachDecision, makeCoachDecision } from './engines/index.js'
import { muscleThresholds } from './engines/muscleThresholds.js'

export const bodyMuscles = Object.freeze({
  chest: { name: 'Bröst', view: 'front' }, 'front-delts': { name: 'Främre axlar', view: 'front' }, biceps: { name: 'Biceps', view: 'front' },
  quads: { name: 'Framsida lår', view: 'front' }, calves: { name: 'Vader', view: 'front' }, triceps: { name: 'Triceps', view: 'back' },
  lats: { name: 'Lats', view: 'back' }, 'upper-back': { name: 'Övre rygg', view: 'back' }, glutes: { name: 'Säte', view: 'back' }, hamstrings: { name: 'Baksida lår', view: 'back' },
})

const recommendationLabels = { push: 'Bröst + Triceps', pull: 'Rygg + Biceps', legs: 'Ben', upper: 'Överkropp', lower: 'Underkropp', full_body: 'Helkropp', recovery: 'Återhämtningsdag' }
const intensityLabels = { low: 'Låg', moderate: 'Måttlig', high: 'Hög' }

function normalizeSessions(workouts = [], liveSession) {
  const sessions = workouts.filter(workout => workout?.exercises?.length).map(workout => ({ ...workout, completedAt: workout.completedAt || workout.date }))
  if (liveSession?.exercises?.length) sessions.push({ ...liveSession, completedAt: new Date().toISOString(), exercises: liveSession.exercises.map(exercise => ({ ...exercise, exerciseId: exercise.exerciseId || exercise.id, sets: (exercise.sets || []).filter(set => set.done) })) })
  return sessions
}

function formatRelative(date, now) {
  if (!date) return 'Inte tränad ännu'
  const hours = Math.max(0, Math.round((new Date(now) - new Date(date)) / 3600000))
  return hours < 24 ? `${hours} tim sedan` : `${Math.round(hours / 24)} dagar sedan`
}

export function getBodyHighlightState(muscleId, selectedMuscleId, focusMuscles = []) {
  if (muscleId === selectedMuscleId) return 'selected'
  if (focusMuscles.includes(muscleId)) return 'recommended'
  return 'none'
}

export function sortVolumeSummary(muscles, sort = 'highest') {
  return [...muscles].sort((left, right) => sort === 'alphabetical'
    ? left.name.localeCompare(right.name, 'sv')
    : sort === 'lowest' ? left.effectiveSets - right.effectiveSets : right.effectiveSets - left.effectiveSets)
}

export function buildBodyDashboardModel({ workouts = [], liveSession = null, exerciseLibrary = [], goal = {}, now = new Date(), trainingStreak = 0, restDays = 0 } = {}) {
  const sessions = normalizeSessions(workouts, liveSession)
  const intelligence = buildMuscleIntelligence(sessions, exerciseLibrary, now)
  const recovery = buildRecoveryIntelligence(intelligence, now)
  const goalProfile = buildGoalProfile(goal)
  const coach = makeCoachDecision({ session: liveSession, workoutHistory: workouts, muscleIntelligence: intelligence, recovery, goalProfile })
  const muscles = Object.entries(bodyMuscles).map(([id, meta]) => {
    const facts = intelligence[id] || {}
    const localRecovery = recovery.muscles[id] || { recoveryPercentage: 100, status: 'recovered', recommendedWait: 0 }
    const thresholds = muscleThresholds[id]
    const priority = (goalProfile.priorityMuscles || []).includes(id) || (facts.effectiveSets || 0) < thresholds.mev
    const status = priority && localRecovery.recoveryPercentage >= 70 ? 'priority' : localRecovery.status === 'recovered' ? 'ready' : localRecovery.status
    const recentExercises = exerciseLibrary.filter(exercise => [...(exercise.primary || []), ...(exercise.secondary || [])].includes(id))
    const history = buildMuscleHistory(sessions, exerciseLibrary, id, { now })
    return {
      id, ...meta, ...facts, ...localRecovery, status, thresholds, history,
      setsRemaining: Math.max(0, thresholds.mav - Math.round(facts.effectiveSets || 0)),
      lastTrainedLabel: formatRelative(facts.lastTrained, now),
      fullRecoveryLabel: localRecovery.recommendedWait ? `Om ${localRecovery.recommendedWait} timmar` : 'Återhämtad',
      coachRecommendation: status === 'fatigued' ? 'Vila området idag.' : status === 'recovering' ? 'Sänk volym och intensitet.' : priority ? `Prioritera ${Math.max(1, thresholds.mev - Math.round(facts.effectiveSets || 0))} set.` : 'Kan tränas normalt.',
      recentExercises: history.recentExercises.length ? history.recentExercises.map(exercise => exercise.name) : recentExercises.slice(0, 3).map(exercise => exercise.name),
      equipment: history.mostCommonEquipment || [...new Set(recentExercises.map(exercise => exercise.equipment))].slice(0, 2).join(' · ') || 'Ingen data',
    }
  })
  const fatigueScore = recovery.overallFatigue
  const focusNames = coach.focusMuscles.map(id => bodyMuscles[id]?.name).filter(Boolean)
  return {
    muscles,
    focus: coach.decision === 'recovery' ? 'Återhämtningsdag' : focusNames.join(' + ') || recommendationLabels[coach.recommendation] || 'Återhämtningsdag',
    focusMuscles: coach.focusMuscles,
    recovery: { readiness: recovery.overallReadiness, recoveryScore: recovery.overallReadiness, fatigueScore, intensity: intensityLabels[coach.sessionIntensity] || coach.sessionIntensity, duration: coach.estimatedDuration, trainingStreak, restDays },
    coach: { ...coach, message: buildCoachMessage(muscles, coach), explanation: explainCoachDecision(coach, 'sv') },
    volume: { highest: sortVolumeSummary(muscles, 'highest').slice(0, 3), lowest: sortVolumeSummary(muscles, 'lowest').slice(0, 3), balanced: muscles.filter(muscle => muscle.trainingZone === 'productive') },
    hasHistory: sessions.some(session => session.exercises?.some(exercise => exercise.sets?.length)),
  }
}

function buildCoachMessage(muscles, coach) {
  const ready = muscles.find(muscle => coach.focusMuscles.includes(muscle.id))
  const recovering = muscles.find(muscle => coach.avoidMuscles.includes(muscle.id))
  const low = sortVolumeSummary(muscles, 'lowest')[0]
  return [ready && `${ready.name} är återhämtad.`, recovering && `${recovering.name} behöver mer tid.`, low && `${low.name} ligger under målvolym.`].filter(Boolean).join(' ') || 'Logga ett pass för en personlig rekommendation.'
}
