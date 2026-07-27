import { average, clamp, DAY, immutable } from './RecoveryModels.js'

const sessionLoad = workout => Number(workout.load) || (Number(workout.durationMinutes ?? workout.duration) || 0) * (Number(workout.intensity ?? workout.rpe) || 5)
export function calculateTrainingLoad(history = [], now = new Date()) {
  const current = new Date(now).getTime()
  const loads = history.map(workout => ({ load: sessionLoad(workout), age: (current - new Date(workout.completedAt ?? workout.date ?? current).getTime()) / DAY })).filter(item => Number.isFinite(item.age) && item.age >= 0)
  const sumWithin = days => loads.filter(item => item.age < days).reduce((sum, item) => sum + item.load, 0)
  const daily = sumWithin(1), weekly = sumWithin(7), monthly = sumWithin(28)
  const acuteLoad = weekly / 7
  const chronicLoad = monthly / 28
  const ratio = chronicLoad ? acuteLoad / chronicLoad : acuteLoad ? 1 : 0
  const status = ratio === 0 ? 'undertraining' : ratio < .8 ? 'undertraining' : ratio <= 1.3 ? 'optimal' : ratio <= 1.6 ? 'overreaching' : 'potential_overtraining'
  return immutable({ daily: Math.round(daily), weekly: Math.round(weekly), monthly: Math.round(monthly), acuteLoad: Math.round(acuteLoad), chronicLoad: Math.round(chronicLoad), acuteChronicRatio: Math.round(ratio * 100) / 100, status, score: Math.round(clamp(ratio <= 1.3 ? 100 - Math.abs(1 - ratio) * 50 : 100 - (ratio - 1.3) * 100)), averageSessionLoad: Math.round(average(loads.map(item => item.load))) })
}
