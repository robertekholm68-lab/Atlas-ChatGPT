import { createHealthSnapshot, healthSnapshotKey } from './HealthModels.js'

/** In-memory append-only store. Persistence adapters can hydrate it without changing engine consumers. */
export class HealthStorage {
  #snapshots = []
  #keys = new Set()
  #byTimestamp = new Map()

  constructor(snapshots = []) { this.appendMany(snapshots) }

  append(input) {
    const snapshot = createHealthSnapshot(input)
    const key = healthSnapshotKey(snapshot)
    if (this.#keys.has(key)) return false
    this.#keys.add(key)
    this.#snapshots.push(snapshot)
    this.#snapshots.sort((left, right) => left.timestamp.localeCompare(right.timestamp))
    this.#byTimestamp.set(snapshot.timestamp, snapshot)
    return true
  }

  appendMany(snapshots = []) { return snapshots.reduce((count, snapshot) => count + Number(this.append(snapshot)), 0) }
  get size() { return this.#snapshots.length }
  latest() { return this.#snapshots.at(-1) ?? null }
  getByTimestamp(timestamp) { return this.#byTimestamp.get(new Date(timestamp).toISOString()) ?? null }
  all() { return Object.freeze([...this.#snapshots]) }
  between(start, end) {
    const from = new Date(start).getTime(); const to = new Date(end).getTime()
    return Object.freeze(this.#snapshots.filter(item => { const time = new Date(item.timestamp).getTime(); return time >= from && time <= to }))
  }
}

