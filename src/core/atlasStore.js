const STORAGE_KEY = 'atlas-core-v1'

const defaultState = {
  version: 4,
  profile: {},
  goals: [],
  goalPlans: { active: null, history: [] },
  workouts: [],
  recovery: { muscles: {}, score: 100, updatedAt: null },
  predictions: {
    generatedAt: null,
    items: [],
    scenarios: []
  },
  memory: {
    generatedAt: null,
    trainingPattern: {
      totalSessions: 0,
      sessionsLast28Days: 0,
      averageSessionsPerWeek: 0,
      favoriteTrainingDay: null,
      lastWorkoutAt: null,
      daysSinceLastWorkout: null
    },
    exercises: [],
    personalRecords: [],
    painNotes: [],
    memories: []
  },
  coach: { recommendation: null, recommendationHistory: [], messages: [], memories: [], insights: [] },
  decisions: { current: null, history: [], logs: [] },
  events: []
}

let state = loadState()
const listeners = new Set()

function cloneDefaultState() {
  return typeof structuredClone === 'function'
    ? structuredClone(defaultState)
    : JSON.parse(JSON.stringify(defaultState))
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneDefaultState()
    const saved = JSON.parse(raw)
    return {
      ...cloneDefaultState(),
      ...saved,
      version: defaultState.version,
      recovery: { ...defaultState.recovery, ...(saved.recovery || {}) },
      predictions: { ...defaultState.predictions, ...(saved.predictions || {}) },
      memory: {
        ...defaultState.memory,
        ...(saved.memory || {}),
        trainingPattern: {
          ...defaultState.memory.trainingPattern,
          ...(saved.memory?.trainingPattern || {})
        }
      },
      coach: { ...defaultState.coach, ...(saved.coach || {}), messages: saved.coach?.messages || saved.coach?.chat || defaultState.coach.messages, insights: saved.coach?.insights || [], memories: saved.coach?.memories || [] },
      decisions: { ...defaultState.decisions, ...(saved.decisions || {}) },
      goalPlans: { ...defaultState.goalPlans, ...(saved.goalPlans || {}) }
    }
  } catch {
    return cloneDefaultState()
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ATLAS fortsätter fungera även om lokal lagring blockeras.
  }
}

function notify() {
  listeners.forEach(listener => listener(state))
}

export function getAtlasState() {
  return state
}

export function setAtlasState(updater) {
  state = typeof updater === 'function' ? updater(state) : updater
  persist()
  notify()
  return state
}

export function subscribeAtlas(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function resetAtlasState() {
  state = cloneDefaultState()
  persist()
  notify()
}
