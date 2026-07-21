const STORAGE_KEY = 'atlas-core-v1'

const defaultState = {
  version: 2,
  profile: {},
  goals: [],
  workouts: [],
  recovery: { muscles: {}, score: 100, updatedAt: null },
  coach: { memories: [], insights: [] },
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
      recovery: { ...defaultState.recovery, ...(saved.recovery || {}) },
      coach: { ...defaultState.coach, ...(saved.coach || {}) },
      decisions: { ...defaultState.decisions, ...(saved.decisions || {}) }
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
