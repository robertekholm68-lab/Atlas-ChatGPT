const MUSCLE_GROUP_ORDER = ['Bröst', 'Rygg', 'Framsida lår', 'Baksida lår', 'Säte', 'Axlar', 'Biceps', 'Triceps', 'Bål', 'Vader', 'Underarmar']

function clamp(value, min = 0, max = 100) {
  const number = Number(value)
  if (!Number.isFinite(number)) return min
  return Math.max(min, Math.min(max, number))
}

function readinessFromFatigue(entry) {
  return Math.round(100 - clamp(entry?.fatigue || 0))
}

function recoveryTone(score) {
  if (score >= 75) return 'ready'
  if (score >= 50) return 'caution'
  return 'recover'
}

function primaryAdvice(score, checkIn = {}) {
  const soreness = Number(checkIn.soreness || 0)
  const stress = Number(checkIn.stress || 0)
  const sleep = Number(checkIn.sleep || 0)
  const pain = checkIn.pain || 'none'

  if (pain === 'moderate') return 'Välj smärtfri rörelse, teknik och återhämtning idag.'
  if (score < 50 || soreness >= 8) return 'Prioritera återhämtning, promenad och rörlighet före tung belastning.'
  if (score < 75 || stress >= 8 || sleep < 6) return 'Träna kontrollerat med reducerad volym och lämna 3 repetitioner i reserv.'
  return 'Kroppen är redo för kvalitetsträning med normal volym och kontrollerad progression.'
}

function sleepLabel(hours) {
  if (!Number.isFinite(Number(hours))) return 'Ej loggat'
  if (hours >= 7.5) return 'Stark sömn'
  if (hours >= 6.5) return 'Godkänd sömn'
  return 'Kort sömn'
}

export function buildRecoveryViewModel({ profile = {}, core = {}, readiness } = {}) {
  const score = Math.round(clamp(readiness ?? profile.recovery?.total ?? core.recovery?.score ?? 100))
  const checkIn = profile.checkIn || {}
  const recoveredMuscles = core.recovery?.muscles || {}
  const muscles = Object.entries(recoveredMuscles)
    .map(([name, entry]) => ({ name, readiness: readinessFromFatigue(entry), fatigue: Math.round(clamp(entry?.fatigue || 0)), updatedAt: entry?.updatedAt || null }))
    .sort((a, b) => (MUSCLE_GROUP_ORDER.indexOf(a.name) === -1 ? 99 : MUSCLE_GROUP_ORDER.indexOf(a.name)) - (MUSCLE_GROUP_ORDER.indexOf(b.name) === -1 ? 99 : MUSCLE_GROUP_ORDER.indexOf(b.name)) || a.name.localeCompare(b.name))

  const mostLoaded = [...muscles].sort((a, b) => a.readiness - b.readiness)[0] || null
  const freshest = [...muscles].sort((a, b) => b.readiness - a.readiness)[0] || null
  const recentWorkouts = (core.workouts || []).slice(0, 3).map(workout => ({
    id: workout.id || workout.completedAt || workout.date || workout.name,
    name: workout.name || 'Träningspass',
    sets: Number(workout.sets || 0),
    completedAt: workout.completedAt || workout.date || null
  }))

  return {
    score,
    tone: recoveryTone(score),
    headline: score >= 75 ? 'Redo att bygga' : score >= 50 ? 'Håll igen smart' : 'Återhämtning först',
    advice: primaryAdvice(score, checkIn),
    sleep: { value: Number(checkIn.sleep || 0), label: sleepLabel(checkIn.sleep) },
    stress: { value: Number(checkIn.stress || 0), label: Number(checkIn.stress || 0) >= 7 ? 'Hög stress' : 'Kontrollerad' },
    soreness: { value: Number(checkIn.soreness || 0), label: Number(checkIn.soreness || 0) >= 7 ? 'Hög ömhet' : 'Hanterbar' },
    energy: { value: Number(checkIn.energy || 0), label: Number(checkIn.energy || 0) >= 7 ? 'Bra energi' : 'Begränsad energi' },
    pain: checkIn.pain || 'none',
    muscles,
    mostLoaded,
    freshest,
    recentWorkouts,
    hasCoreRecovery: muscles.length > 0
  }
}
