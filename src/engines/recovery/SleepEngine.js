import { average, clamp, DAY, immutable } from './RecoveryModels.js'

export function calculateSleep(input = {}) {
  const records = (input.records || input.history || []).map(item => ({ ...item, hours: Number(item.hours ?? item.duration) || 0 }))
  const latest = records.at(-1) || input
  const hours = Number(latest.hours ?? latest.duration) || 0
  const target = Number(input.targetHours) || 8
  const quality = clamp((hours / target) * 70 + clamp(latest.deepSleepPercentage ?? latest.deepSleep ?? 0) * 0.3)
  const recent = records.slice(-7)
  const consistency = recent.length < 2 ? (hours ? 70 : 0) : clamp(100 - Math.sqrt(average(recent.map(item => (item.hours - average(recent.map(entry => entry.hours))) ** 2))) * 22)
  const sleepDebt = recent.reduce((debt, item) => debt + Math.max(0, target - item.hours), 0)
  const previous = records.slice(-6, -1)
  const trend = previous.length ? hours - average(previous.map(item => item.hours)) : 0
  const deepSleepContribution = clamp(latest.deepSleepPercentage ?? latest.deepSleep ?? 0)
  return immutable({ score: Math.round(clamp(quality * 0.6 + consistency * 0.25 + (100 - clamp(sleepDebt * 5)) * 0.15)), quality: Math.round(quality), consistency: Math.round(consistency), sleepDebt: Math.round(sleepDebt * 10) / 10, trend: trend > .25 ? 'improving' : trend < -.25 ? 'declining' : 'stable', deepSleepContribution: Math.round(deepSleepContribution), recoveryContribution: Math.round(clamp(quality * .7 + deepSleepContribution * .3)), dataDays: recent.length, periodStart: recent[0]?.timestamp ? new Date(new Date(recent[0].timestamp).getTime() - DAY).toISOString() : null })
}
