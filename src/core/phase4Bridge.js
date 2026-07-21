import { recordCompletedWorkout } from './eventEngine'

const PHASE4_KEY = 'atlas-phase4'

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
      muscleContribution: exercise.muscleContribution || {},
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
        const workout = normalizeCompletedSession(completedSession, {
          ...newestHistory,
          completedAt: new Date().toISOString()
        })
        recordCompletedWorkout(workout)
      }

      previous = next
    }

    return originalSetItem(key, value)
  }

  return () => {
    storage.setItem = originalSetItem
  }
}
