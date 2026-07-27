import { createHealthSnapshot, HEALTH_SOURCES } from '../../src/engines/health/index.js'

const at = (overrides = {}) => createHealthSnapshot({ timestamp: '2026-07-27T07:00:00.000Z', source: HEALTH_SOURCES.OURA, restingHeartRate: 52, heartRateVariability: 72, sleepDuration: 8, sleepScore: 88, stressScore: 22, steps: 8500, activeCalories: 620, bodyWeight: 78, bodyFat: 14, hydration: 82, energyLevel: 85, trainingLoad: 58, ...overrides })

export const healthFixtures = Object.freeze({
  healthyAthlete: at(),
  overtrainedAthlete: at({ restingHeartRate: 68, heartRateVariability: 31, sleepScore: 58, stressScore: 75, trainingLoad: 98 }),
  poorSleep: at({ sleepDuration: 4.2, sleepScore: 32, energyLevel: 35 }),
  excellentRecovery: at({ restingHeartRate: 47, heartRateVariability: 105, sleepScore: 96, stressScore: 10, energyLevel: 96 }),
  illness: at({ restingHeartRate: 76, heartRateVariability: 18, stressScore: 88, energyLevel: 18 }),
  highStress: at({ stressScore: 94, heartRateVariability: 29, energyLevel: 38 }),
  manualOnlyUser: at({ source: HEALTH_SOURCES.MANUAL, externalId: 'manual-1', heartRateVariability: null, activeCalories: null, trainingLoad: null }),
})
