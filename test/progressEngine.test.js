import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateProgress, detectTrend, getProgressIntelligence } from '../src/engines/ProgressEngine.js'

const dna = [{ id: 'press', name: 'Incline Press', equipment: 'Barbell', primaryMuscles: ['chest'] }]
const session = (date, weight, reps = 8, duration = 50) => ({ id: date, completedAt: `${date}T12:00:00.000Z`, duration, exercises: [{ exerciseId: 'press', sets: [{ kg: weight, reps, done: true }, { kg: weight, reps, done: true }] }] })

test('ProgressEngine returns all PR types and complete personal records', () => {
  const result = calculateProgress([session('2026-07-20', 80, 8)], session('2026-07-27', 85, 10), dna, {}, { now: '2026-07-27T13:00:00.000Z' })
  assert.deepEqual(new Set(result.prs.map(record => record.type)), new Set(['weight', 'reps', 'volume', 'estimated1RM']))
  const record = result.records.personalRecords[0]
  assert.equal(record.bestWeight, 85)
  assert.equal(record.bestReps, 10)
  assert.equal(record.bestSessionVolume, 1700)
  assert.deepEqual(record.bestSet, { weight: 85, reps: 10, volume: 850, estimated1RM: 113.3 })
  assert.equal(record.favoriteEquipment, 'Barbell')
})

test('trend detection is deterministic and reports confidence', () => {
  assert.equal(detectTrend([10, 10, 20, 20]).direction, 'improving')
  assert.equal(detectTrend([20, 20, 20, 20]).direction, 'stable')
  assert.equal(detectTrend([20, 20, 10, 10]).direction, 'declining')
  assert.equal(detectTrend([10, 20, 30, 40]).confidence, 50)
})

test('consistency and period history are calculated from real dates', () => {
  const result = calculateProgress([session('2026-07-20', 70), session('2026-07-21', 72), session('2026-07-27', 75)], null, dna, {}, { now: '2026-07-27T18:00:00.000Z' })
  assert.equal(result.consistency.longestStreak, 2)
  assert.equal(result.consistency.trainingFrequency, 3)
  assert.equal(result.consistency.mostTrainedMuscle, 'chest')
  assert.equal(result.consistency.mostTrainedWeekday, 'Monday')
  assert.equal(result.history.weekly.length, 2)
  assert.ok(result.records.weeklyVolumeRecord.volume > 0)
})

test('empty, demo summary, and large real histories are safe', () => {
  const empty = calculateProgress([], null, dna, {}, { now: '2026-07-27' })
  assert.equal(empty.prs.length, 0)
  assert.equal(empty.consistency.trainingFrequency, 0)
  const demo = calculateProgress([{ id: 1, date: '2026-07-20', volume: 8000, duration: 50 }], null, dna, {}, { now: '2026-07-27' })
  assert.equal(demo.history.weekly[0].volume, 8000)
  const large = Array.from({ length: 5000 }, (_, index) => session(new Date(Date.UTC(2010, 0, index + 1)).toISOString().slice(0, 10), 50 + index % 20))
  const first = calculateProgress(large, null, dna, {}, { now: '2026-07-27' })
  const second = calculateProgress(large, null, dna, {}, { now: '2026-07-27' })
  assert.deepEqual(first, second)
})

test('memoized entry point reuses unchanged progress objects', () => {
  const history = [session('2026-07-20', 80)]
  const muscles = {}
  const first = getProgressIntelligence(history, null, dna, muscles)
  const second = getProgressIntelligence(history, null, dna, muscles)
  assert.equal(first, second)
})
