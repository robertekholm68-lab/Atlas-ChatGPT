import { recordCompletedWorkout } from './eventEngine'

const PHASE4_KEY = 'atlas-phase4'

const MUSCLE_CONTRIBUTION = {
  bench: { Bröst: 1, Triceps: 0.55, Axlar: 0.35 },
  row: { Rygg: 1, Biceps: 0.5, Axlar: 0.25 },
  squat: { Ben: 1, Säte: 0.6, Bål: 0.35 },
  pulldown: { Rygg: 1, Biceps: 0.55 },
  ohp: { Axlar: 1, Triceps: 0.5 },
  legpress: { Ben: 1, Säte: 0.45 },
  rdl: { 'Baksida lår': 1, Säte: 0.65, Rygg: 0.25 },
  curl: { Biceps: 1, Underarmar: 0.35 },
  pushdown: { Triceps: 1 },
  hipthrust: { Säte: 1, 'Baksida lår': 0.45 },
  calf: { Vader: 1 },
  plank: { Bål: 1, Axlar: 0.2 }
}

function parseState(value) {
  try {
    return JSON.parse(value || '{}')
  } catch {
    return {}
  }
}

function normalizeCompletedSession(session, historyEntry) {
  const completedAt = historyEntry?.completedAt || new Date().toISOString()
  const exercises = (session?.exercises || [])
    .map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      equipment: exercise.equipment,
      muscle: exercise.muscle,
      muscleContribution: MUSCLE_CONTRIBUTION[exercise.id] || {},
      sets: (exercise.sets || [])
        .filter(set => set.done)
        .map(set => ({
          kg: Number(set.kg) || 0,
          reps: Number(set.reps) || 0,
          rpe: Number(set.rpe) || 8,
          done: true
        }))
    }))
    .filter(exercise => exercise.sets.length)

  const allSets = exercises.flatMap(exercise => exercise.sets)
  const volume = allSets.reduce((sum, set) => sum + set.kg * set.reps, 0)

  return {
    id: `phase4-${session.id}`,
    source: 'phase4-live-session',
    programId: session.programId,
    name: session.name || historyEntry?.name || 'Träningspass',
    startedAt: new Date(session.startedAt).toISOString(),
    completedAt,
    date: completedAt.slice(0, 10),
    duration: Math.max(1, Math.round((new Date(completedAt).getTime() - Number(session.startedAt)) / 60000)),
    gym: historyEntry?.gym || 'Ej angivet',
    sets: allSets.length,
    volume: Math.round(volume),
    exercises
  }
}

export function installPhase4Bridge() {
  if (typeof window === 'undefined') return () => {}

  const storage = window.localStorage
  const originalSetItem = storage.setItem.bind(storage)
  let previous = parseState(storage.getItem(PHASE4_KEY))

  storage.setItem = (key, value) => {
    if (key === PHASE4_KEY) {
      const next = parseState(value)
      const completedSession = previous.session && !next.session ? previous.session : null

      if (completedSession) {
        const newestHistory = next.history?.[0]
        recordCompletedWorkout(normalizeCompletedSession(completedSession, {
          ...newestHistory,
          completedAt: new Date().toISOString()
        }))
      }

      previous = next
    }

    return originalSetItem(key, value)
  }

  return () => {
    storage.setItem = originalSetItem
  }
}
