const HIGH_FATIGUE = 75
const MODERATE_FATIGUE = 50

function newestWorkout(workouts = []) {
  return [...workouts].sort((a, b) => {
    const aTime = new Date(a.completedAt || a.date || 0).getTime()
    const bTime = new Date(b.completedAt || b.date || 0).getTime()
    return bTime - aTime
  })[0] || null
}

function muscleReadiness(recovery = {}) {
  return Object.entries(recovery.muscles || {})
    .map(([name, value]) => ({
      name,
      fatigue: Number(value?.fatigue || 0),
      readiness: Math.max(0, Math.round(100 - Number(value?.fatigue || 0)))
    }))
    .sort((a, b) => b.readiness - a.readiness)
}

function findPersonalRecords(workout, previousWorkouts = []) {
  if (!workout?.exercises?.length) return []
  const records = []

  workout.exercises.forEach(exercise => {
    const currentBest = Math.max(0, ...(exercise.sets || []).map(set => Number(set.kg || 0)))
    if (!currentBest) return

    const previousBest = Math.max(0, ...previousWorkouts.flatMap(previous =>
      (previous.exercises || [])
        .filter(item => item.id === exercise.id || item.name === exercise.name)
        .flatMap(item => (item.sets || []).map(set => Number(set.kg || 0)))
    ))

    if (currentBest > previousBest) {
      records.push({
        type: 'personal-record',
        title: `Nytt vikt-PB i ${exercise.name}`,
        message: `${currentBest} kg är högre än ditt tidigare registrerade bästa på ${previousBest || 0} kg.`,
        exerciseId: exercise.id,
        value: currentBest,
        previousValue: previousBest
      })
    }
  })

  return records
}

export function evaluateAtlasDecisions(state, context = {}) {
  const workout = context.workout || newestWorkout(state.workouts)
  const readiness = Number(state.recovery?.score ?? 100)
  const muscles = muscleReadiness(state.recovery)
  const mostReady = muscles[0]
  const leastReady = [...muscles].sort((a, b) => a.readiness - b.readiness)[0]
  const decisions = []
  const steps = []

  steps.push({ label: 'Event mottaget', status: 'done' })
  if (workout) steps.push({ label: `Pass analyserat: ${workout.name || 'Träningspass'}`, status: 'done' })
  steps.push({ label: `Återhämtning beräknad: ${readiness}%`, status: 'done' })

  if (leastReady?.fatigue >= HIGH_FATIGUE) {
    decisions.push({
      id: `avoid-${leastReady.name}-${Date.now()}`,
      category: 'recovery',
      priority: 'high',
      title: `Undvik tung belastning för ${leastReady.name}`,
      action: 'reduce-load',
      message: `${leastReady.name} är endast ${leastReady.readiness}% återhämtad. Välj annan muskelgrupp eller minska volymen tydligt.`,
      evidence: [`${leastReady.name}: ${leastReady.readiness}% återhämtad`, `Total återhämtning: ${readiness}%`],
      createdAt: new Date().toISOString()
    })
  } else if (leastReady?.fatigue >= MODERATE_FATIGUE) {
    decisions.push({
      id: `modify-${leastReady.name}-${Date.now()}`,
      category: 'recovery',
      priority: 'medium',
      title: `Modifiera belastningen för ${leastReady.name}`,
      action: 'modify-volume',
      message: `${leastReady.name} är delvis återhämtad. Behåll teknikfokus och minska arbetsseten med ungefär 20%.`,
      evidence: [`${leastReady.name}: ${leastReady.readiness}% återhämtad`, 'Regel: reducerad volym vid 50–74% trötthet'],
      createdAt: new Date().toISOString()
    })
  }

  if (mostReady && mostReady.readiness >= 85) {
    decisions.push({
      id: `ready-${mostReady.name}-${Date.now()}`,
      category: 'training',
      priority: 'normal',
      title: `${mostReady.name} är redo för kvalitetsträning`,
      action: 'train',
      message: `${mostReady.name} har högst beräknad återhämtning och är ett bra val för nästa pass.`,
      evidence: [`${mostReady.name}: ${mostReady.readiness}% återhämtad`, `Total återhämtning: ${readiness}%`],
      createdAt: new Date().toISOString()
    })
  }

  const previousWorkouts = (state.workouts || []).filter(item => String(item.id) !== String(workout?.id))
  const records = findPersonalRecords(workout, previousWorkouts)
  records.forEach(record => decisions.push({
    id: `pb-${record.exerciseId}-${Date.now()}`,
    category: 'progress',
    priority: 'positive',
    title: record.title,
    action: 'celebrate',
    message: record.message,
    evidence: [`Nytt värde: ${record.value} kg`, `Tidigare bästa: ${record.previousValue || 0} kg`],
    createdAt: new Date().toISOString()
  }))

  if (!decisions.length) {
    decisions.push({
      id: `stable-${Date.now()}`,
      category: 'training',
      priority: 'normal',
      title: 'Fortsätt enligt planen',
      action: 'continue',
      message: 'Ingen tydlig risk eller avvikelse hittades. Behåll planerad belastning och följ upp RPE efter passet.',
      evidence: [`Total återhämtning: ${readiness}%`, `${state.workouts?.length || 0} pass i träningshistoriken`],
      createdAt: new Date().toISOString()
    })
  }

  steps.push({ label: `${decisions.length} beslut skapade`, status: 'done' })
  if (records.length) steps.push({ label: `${records.length} personbästa upptäckta`, status: 'done' })
  steps.push({ label: 'Dashboard och coach uppdaterade', status: 'done' })

  return {
    current: decisions[0],
    generated: decisions,
    log: {
      id: `decision-run-${Date.now()}`,
      trigger: context.trigger || 'state.updated',
      workoutId: workout?.id || null,
      steps,
      createdAt: new Date().toISOString()
    }
  }
}

export function explainDecision(decision) {
  if (!decision) return 'Inget beslut finns ännu.'
  const evidence = (decision.evidence || []).map(item => `• ${item}`).join('\n')
  return `${decision.message}${evidence ? `\n\nUnderlag:\n${evidence}` : ''}`
}
