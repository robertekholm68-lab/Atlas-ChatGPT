import { createNutritionDay } from './NutritionModels.js'

export class NutritionStorage {
  #days = new Map()
  constructor(days = []) { days.forEach(day => this.save(day)) }
  save(input) { const day = createNutritionDay(input); this.#days.set(day.date, day); return day }
  get(date) { return this.#days.get(String(date).slice(0, 10)) ?? null }
  remove(date) { return this.#days.delete(String(date).slice(0, 10)) }
  latest() { return this.all().at(-1) ?? null }
  all() { return Object.freeze([...this.#days.values()].sort((a, b) => a.date.localeCompare(b.date))) }
  between(start, end) { const from = String(start).slice(0, 10); const to = String(end).slice(0, 10); return Object.freeze(this.all().filter(day => day.date >= from && day.date <= to)) }
  get size() { return this.#days.size }
  serialize() { return JSON.stringify(this.all()) }
  static hydrate(serialized = '[]') { const value = JSON.parse(serialized); if (!Array.isArray(value)) throw new TypeError('Nutrition storage payload must be an array.'); return new NutritionStorage(value) }
}
