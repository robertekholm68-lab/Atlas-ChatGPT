const STORAGE_KEY = 'atlas-core-v1'

const defaultState = {
  version: 1,
  profile: {},
  goals: [],
  workouts: [],
  recovery: { muscles: {}, updatedAt: null },
  coach: { memories: [], insights: [] },
  events: []
}

let state = loadState()
const listeners = new Set()

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaultState, ...JSON.parse(raw) } : structuredClone(defaultState)
  } catch {
    return structuredClone(defaultState)
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
  state = structuredClone(defaultState)
  persist()
  notify()
}
