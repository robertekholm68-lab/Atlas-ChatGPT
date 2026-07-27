const base = { timestamp: '2026-07-27T08:00:00.000Z', baselineHRV: 60, baselineRestingHeartRate: 58, healthScore: 80, bodyRecovery: 80, muscles: {} }
const sleep = (hours, deepSleepPercentage = 70) => ({ records: [{ hours, deepSleepPercentage }] })
export const recoveryScenarios = Object.freeze({
  excellentRecovery: { ...base, HRV: 70, restingHeartRate: 55, sleep: sleep(8.5, 85), manualStress: 1 },
  poorSleep: { ...base, HRV: 52, sleep: sleep(4.5, 35), manualStress: 5 },
  travelFatigue: { ...base, HRV: 45, restingHeartRate: 66, sleep: sleep(5), manualStress: 7 },
  illness: { ...base, HRV: 35, restingHeartRate: 75, healthScore: 35, sleep: sleep(7), manualStress: 6 },
  heavyTrainingWeek: { ...base, workoutHistory: Array.from({ length: 7 }, (_, index) => ({ date: `2026-07-${27 - index}T07:00:00Z`, durationMinutes: 75, intensity: 9 })), sleep: sleep(7) },
  deloadWeek: { ...base, workoutHistory: [{ date: '2026-07-26T07:00:00Z', durationMinutes: 30, intensity: 3 }], sleep: sleep(8) },
  highHRV: { ...base, HRV: 85, sleep: sleep(8) }, lowHRV: { ...base, HRV: 30, sleep: sleep(8) },
  stressAtWork: { ...base, HRV: 48, manualStress: 9, sleep: sleep(6) },
  manualOnlyUser: { timestamp: base.timestamp, manualStress: 4, sleep: sleep(7), muscles: {} },
})
