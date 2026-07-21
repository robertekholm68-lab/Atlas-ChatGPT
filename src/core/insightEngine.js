const DAY_MS = 24 * 60 * 60 * 1000

const SWEDISH_DAYS = ['söndagar', 'måndagar', 'tisdagar', 'onsdagar', 'torsdagar', 'fredagar', 'lördagar']
const MUSCLE_ALIASES = {
  Bröst: 'Bröst', Triceps: 'Triceps', Axlar: 'Axlar', Rygg: 'Rygg', Biceps: 'Biceps',
  Ben: 'Framsida lår', 'Framsida lår': 'Framsida lår', Säte: 'Säte', Bål: 'Bål',
  'Baksida lår': 'Baksida lår', Underarmar: 'Underarmar', Vader: 'Vader', Lats: 'Rygg'
}

function workoutTime(workout) {
  const value = workout?.completedAt || workout?.date
  if (!value) return 0
  const parsed = new Date(workout.completedAt || `${workout.date}T18:00:00`).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

function completedSets(exercise) {
  return (exercise?.sets || []).filter(set => set.done !== false)
}

function skippedSets(exercise) {
  return (exercise?.sets || []).filter(set => set.done === false)
}

function stableId(parts) {
  return parts.filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9åäö]+/gi, '-').replace(/^-|-$/g, '')
}

function createInsight({ category, severity = 'info', confidence = .5, title, description, recommendation, evidence = [] }, now) {
  return {
    id: stableId(['insight', category, title]),
    category,
    severity,
    confidence: Math.max(0, Math.min(1, Math.round(confidence * 100) / 100)),
    title,
    description,
    recommendation,
    evidence,
    createdAt: new Date(now).toISOString()
  }
}

function muscleVolumes(workouts) {
  const volumes = {}
  const lastTrained = {}
  workouts.forEach(workout => {
    const time = workoutTime(workout)
    ;(workout.exercises || []).forEach(exercise => {
      const sets = completedSets(exercise)
      if (!sets.length) return
      const setCount = sets.length
      Object.entries(exercise.muscleContribution || {}).forEach(([rawName, share]) => {
        const name = MUSCLE_ALIASES[rawName] || rawName
        volumes[name] = (volumes[name] || 0) + setCount * Number(share || 0)
        if (time) lastTrained[name] = Math.max(lastTrained[name] || 0, time)
      })
    })
  })
  return { volumes, lastTrained }
}

function bestWeightByExercise(workouts, exerciseName) {
  return workouts
    .flatMap(workout => (workout.exercises || [])
      .filter(exercise => exercise.name === exerciseName)
      .flatMap(exercise => completedSets(exercise).map(set => Number(set.kg || set.weight || 0))))
    .filter(Boolean)
}

function generateTrainingFrequencyInsights(workouts, now) {
  const insights = []
  const dated = workouts.filter(workout => workoutTime(workout) > 0)
  if (dated.length >= 3) {
    const weekdays = Array.from({ length: 7 }, () => 0)
    dated.forEach(workout => { weekdays[new Date(workoutTime(workout)).getDay()] += 1 })
    const maxCount = Math.max(...weekdays)
    const dayIndex = weekdays.indexOf(maxCount)
    if (maxCount >= 2) {
      insights.push(createInsight({
        category: 'habit',
        severity: 'positive',
        confidence: Math.min(.95, maxCount / dated.length + .25),
        title: `Du tränar oftast på ${SWEDISH_DAYS[dayIndex]}`,
        description: `${maxCount} av ${dated.length} registrerade pass ligger på ${SWEDISH_DAYS[dayIndex]}.`,
        recommendation: 'Använd den dagen som ankare när du planerar veckans viktigaste pass.',
        evidence: [`${maxCount} pass på ${SWEDISH_DAYS[dayIndex]}`, `${dated.length} pass analyserade`]
      }, now))
    }
  }

  const last28 = dated.filter(workout => now - workoutTime(workout) <= 28 * DAY_MS).length
  const previous28 = dated.filter(workout => now - workoutTime(workout) > 28 * DAY_MS && now - workoutTime(workout) <= 56 * DAY_MS).length
  if (previous28 >= 3 && last28 <= Math.floor(previous28 * .6)) {
    insights.push(createInsight({
      category: 'consistency',
      severity: 'warning',
      confidence: .82,
      title: 'Träningsfrekvensen har sjunkit senaste månaden',
      description: `Du har gått från ${previous28} pass föregående 28 dagar till ${last28} pass senaste 28 dagar.`,
      recommendation: 'Sänk tröskeln med kortare pass eller boka två fasta träningsdagar kommande vecka.',
      evidence: [`Senaste 28 dagar: ${last28}`, `Föregående 28 dagar: ${previous28}`]
    }, now))
  }
  return insights
}

function generateMuscleBalanceInsights(workouts, now) {
  const insights = []
  const recent = workouts.filter(workout => now - workoutTime(workout) <= 56 * DAY_MS)
  const { volumes, lastTrained } = muscleVolumes(recent)
  const chest = volumes.Bröst || 0
  const back = volumes.Rygg || 0
  if (chest >= 8 && back > 0 && chest / back >= 1.6) {
    insights.push(createInsight({ category: 'balance', severity: 'warning', confidence: .78, title: 'Bröstvolymen är tydligt högre än ryggvolymen', description: `Senaste åtta veckorna är bröstvolymen ${Math.round(chest)} set-ekvivalenter mot ryggens ${Math.round(back)}.`, recommendation: 'Lägg in extra horisontella och vertikala drag tills volymen är jämnare.', evidence: [`Bröst: ${Math.round(chest)}`, `Rygg: ${Math.round(back)}`] }, now))
  }

  Object.entries(lastTrained).forEach(([muscle, time]) => {
    const days = Math.floor((now - time) / DAY_MS)
    if (days >= 14) {
      insights.push(createInsight({ category: 'coverage', severity: days >= 21 ? 'warning' : 'info', confidence: .74, title: `${muscle} har inte tränats på ${days} dagar`, description: `Senaste registrerade stimulans för ${muscle} var för ${days} dagar sedan.`, recommendation: `Planera in 2–4 kontrollerade set för ${muscle} under nästa lämpliga pass.`, evidence: [`Senast tränad: ${new Date(time).toISOString().slice(0, 10)}`] }, now))
    }
  })
  return insights
}

function generateProgressInsights(workouts, now) {
  const insights = []
  const names = [...new Set(workouts.flatMap(workout => (workout.exercises || []).map(exercise => exercise.name)).filter(Boolean))]
  names.forEach(name => {
    const recent = bestWeightByExercise(workouts.filter(workout => now - workoutTime(workout) <= 14 * DAY_MS), name)
    const older = bestWeightByExercise(workouts.filter(workout => now - workoutTime(workout) > 42 * DAY_MS && now - workoutTime(workout) <= 70 * DAY_MS), name)
    const recentBest = Math.max(0, ...recent)
    const olderBest = Math.max(0, ...older)
    if (recentBest && olderBest && recentBest - olderBest >= 5) {
      const diff = Math.round((recentBest - olderBest) * 10) / 10
      insights.push(createInsight({ category: 'progress', severity: 'positive', confidence: .84, title: `${name} har ökat ${diff} kg på ungefär åtta veckor`, description: `Bästa registrerade vikt har gått från ${olderBest} kg till ${recentBest} kg.`, recommendation: 'Behåll progressionen men prioritera teknik och återhämtning när ökningen fortsätter.', evidence: [`Tidigare bästa: ${olderBest} kg`, `Nytt bästa: ${recentBest} kg`] }, now))
    }
  })
  return insights
}

function generateRecoveryAndCompletionInsights(workouts, state, now) {
  const insights = []
  const recent = workouts.filter(workout => now - workoutTime(workout) <= 42 * DAY_MS)
  const legDays = recent.filter(workout => (workout.exercises || []).some(exercise => Object.keys(exercise.muscleContribution || {}).some(name => ['Ben', 'Framsida lår', 'Baksida lår', 'Säte'].includes(name))))
  if (legDays.length >= 2 && Number(state.recovery?.score || 100) < 65) {
    insights.push(createInsight({ category: 'recovery', severity: 'warning', confidence: .68, title: 'Återhämtningen är ofta låg efter underkroppspass', description: `ATLAS ser ${legDays.length} benrelaterade pass senaste sex veckorna och nuvarande återhämtningsscore är ${state.recovery.score}%.`, recommendation: 'Lägg in lättare dag efter benpass och följ sömn, RPE och eventuell ömhet extra noga.', evidence: [`Benpass senaste 42 dagar: ${legDays.length}`, `Recovery score: ${state.recovery.score}%`] }, now))
  }

  const skipLastCount = recent.filter(workout => {
    const last = (workout.exercises || []).at(-1)
    return last && skippedSets(last).length > 0 && completedSets(last).length < (last.sets || []).length
  }).length
  if (recent.length >= 4 && skipLastCount / recent.length >= .4) {
    insights.push(createInsight({ category: 'adherence', severity: 'info', confidence: .73, title: 'Du skippar ofta sista tillbehörsövningen', description: `${skipLastCount} av ${recent.length} senaste pass har ofullständiga set i sista övningen.`, recommendation: 'Flytta den viktigaste tillbehörsövningen tidigare i passet eller minska antalet avslutande set.', evidence: [`Ofullständiga avslut: ${skipLastCount}/${recent.length}`] }, now))
  }
  return insights
}

export function generateAtlasInsights(state = {}, now = Date.now()) {
  const workouts = [...(state.workouts || [])].sort((a, b) => workoutTime(b) - workoutTime(a))
  if (!workouts.length) return []
  return [
    ...generateTrainingFrequencyInsights(workouts, now),
    ...generateMuscleBalanceInsights(workouts, now),
    ...generateProgressInsights(workouts, now),
    ...generateRecoveryAndCompletionInsights(workouts, state, now)
  ].slice(0, 25)
}

export function refreshAtlasInsights(state, now = Date.now()) {
  const insights = generateAtlasInsights(state, now)
  return {
    ...state,
    insights,
    coach: {
      ...(state.coach || {}),
      insights
    }
  }
}
