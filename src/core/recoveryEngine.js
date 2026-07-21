const MUSCLE_ALIASES = {
  Bröst: 'Bröst', Triceps: 'Triceps', Axlar: 'Axlar', Rygg: 'Rygg', Biceps: 'Biceps',
  Ben: 'Framsida lår', 'Framsida lår': 'Framsida lår', Säte: 'Säte', Bål: 'Bål',
  'Baksida lår': 'Baksida lår', Underarmar: 'Underarmar', Vader: 'Vader', Lats: 'Rygg'
}

const RECOVERY_HOURS = 72
const GROUPS = {
  'Upper body': ['Bröst', 'Rygg', 'Axlar', 'Triceps', 'Biceps'],
  'Lower body': ['Framsida lår', 'Ben', 'Baksida lår', 'Säte', 'Vader'],
  Push: ['Bröst', 'Axlar', 'Triceps'],
  Pull: ['Rygg', 'Biceps'],
  Legs: ['Framsida lår', 'Ben', 'Baksida lår', 'Säte', 'Vader'],
  Core: ['Bål'],
  'Cardio fatigue': ['Vader', 'Ben']
}

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

function clampScore(value) { return Math.max(0, Math.min(100, Math.round(Number(value) || 0))) }
function average(values, fallback = 100) { return values.length ? clampScore(values.reduce((sum, value) => sum + value, 0) / values.length) : fallback }
function daysBetween(a, b) { return Math.max(0, Math.floor((a - b) / 864e5)) }
function formatLastTrained(date, now) {
  if (!date) return 'No recent data'
  const days = daysBetween(now, date.getTime())
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}
function contributionForWorkout(workout) {
  const muscles = new Set()
  ;(workout.exercises || []).forEach(exercise => Object.keys(exercise.muscleContribution || {}).forEach(name => muscles.add(MUSCLE_ALIASES[name] || name)))
  return muscles
}
function lastTrainedForGroup(workouts, groupMuscles) {
  const aliases = new Set(groupMuscles.map(name => MUSCLE_ALIASES[name] || name))
  return workouts.find(workout => {
    const muscles = contributionForWorkout(workout)
    return [...aliases].some(name => muscles.has(name)) || [...aliases].some(name => String(workout.name || '').toLowerCase().includes(name.toLowerCase()))
  })
}
function recommendationForScore(score) {
  if (score >= 82) return 'READY TO TRAIN'
  if (score >= 68) return 'TRAIN LIGHT'
  if (score >= 50) return 'ACTIVE RECOVERY'
  return 'REST DAY'
}
function colorForScore(score) {
  if (score >= 82) return 'green'
  if (score >= 68) return 'yellow'
  if (score >= 50) return 'orange'
  return 'red'
}

export function buildRecoveryViewModel(core = {}, now = Date.now()) {
  const recovered = recoverMuscles(core.recovery?.muscles || {}, now)
  const score = clampScore(core.recovery?.score ?? recoveryScore(recovered, now))
  const workouts = [...(core.workouts || [])].sort((a, b) => new Date(b.completedAt || b.date || 0) - new Date(a.completedAt || a.date || 0))
  const breakdown = Object.entries(GROUPS).map(([label, muscles]) => {
    const values = muscles.map(name => recovered[MUSCLE_ALIASES[name] || name]).filter(Boolean).map(entry => 100 - Number(entry.fatigue || 0))
    const recovery = average(values, workouts.length ? score : 100)
    const last = lastTrainedForGroup(workouts, muscles)
    const lastDate = last ? new Date(last.completedAt || `${last.date}T18:00:00`) : null
    const trend = recovery >= 82 ? 'Ready' : recovery >= 68 ? 'Improving' : recovery >= 50 ? 'Loaded' : 'High fatigue'
    return { label, recovery, trend, lastTrained: formatLastTrained(lastDate, now) }
  })
  const best = breakdown.slice().sort((a, b) => b.recovery - a.recovery)[0]
  const worst = breakdown.slice().sort((a, b) => a.recovery - b.recovery)[0]
  const latest = workouts[0]
  const daysSinceLast = latest ? daysBetween(now, new Date(latest.completedAt || `${latest.date}T18:00:00`).getTime()) : null
  const avgRpe = average(workouts.flatMap(w => (w.exercises || []).flatMap(e => (e.sets || []).map(s => Number(s.rpe || 8)))), 8)
  const weekly = workouts.filter(w => now - new Date(w.completedAt || `${w.date}T18:00:00`).getTime() <= 7 * 864e5)
  const factors = [
    { label: 'Sleep', value: 76, detail: 'No live sleep feed; neutral baseline keeps the decision driven by ATLAS training data.' },
    { label: 'Training volume', value: clampScore(100 - Math.min(45, weekly.reduce((s, w) => s + Number(w.sets || 0), 0) * 1.7)), detail: 'More completed sets in the last 7 days lowers readiness.' },
    { label: 'Intensity', value: clampScore(110 - avgRpe * 9), detail: 'Higher logged RPE increases fatigue and suggests lighter work.' },
    { label: 'Consistency', value: clampScore(Math.min(100, weekly.length * 25)), detail: 'Recent completed sessions improve confidence in today’s recommendation.' },
    { label: 'Rest', value: daysSinceLast === null ? 70 : clampScore(Math.min(100, 45 + daysSinceLast * 18)), detail: 'More rest days since the last workout increase readiness.' }
  ]
  const nextAction = score >= 82 ? (best?.label.includes('Lower') || best?.label === 'Legs' ? 'Start Lower Body' : 'Start Upper Body') : score >= 68 ? 'Mobility Session' : score >= 50 ? 'Walking' : 'Recovery Day'
  return {
    score,
    color: colorForScore(score),
    recommendation: recommendationForScore(score),
    breakdown,
    decision: `${best?.label || 'Your body'} is the best target today. ${worst?.recovery < 68 ? `Avoid heavy ${worst.label.toLowerCase()} work today.` : 'Excellent day for personal records.'}`,
    timeline: [
      { label: 'Yesterday', value: clampScore(score - 6), note: latest ? latest.name : 'Rest / no workout logged' },
      { label: 'Today', value: score, note: recommendationForScore(score) },
      { label: 'Tomorrow', value: clampScore(score + 8), note: nextAction }
    ],
    nextWorkoutPrediction: score >= 68 ? nextAction : 'Recovery Day',
    factors,
    nextAction
  }
}
