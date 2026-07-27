import { createHealthSnapshot, HEALTH_SOURCES } from './HealthModels.js'

export class HealthSourceProvider {
  constructor(source, reader = async () => []) {
    if (!Object.values(HEALTH_SOURCES).includes(source)) throw new TypeError(`Unsupported health source: ${source}`)
    if (typeof reader !== 'function') throw new TypeError('Health provider reader must be a function')
    this.source = source
    this.reader = reader
  }

  async getSnapshots(options = {}) {
    const readings = await this.reader(options)
    if (!Array.isArray(readings)) throw new TypeError('Health provider must return an array')
    return Object.freeze(readings.map(reading => createHealthSnapshot({ ...reading, source: this.source })))
  }
}

export const createHealthProvider = (source, reader) => new HealthSourceProvider(source, reader)

export const createAppleHealthProvider = reader => createHealthProvider(HEALTH_SOURCES.APPLE_HEALTH, reader)
export const createHealthConnectProvider = reader => createHealthProvider(HEALTH_SOURCES.HEALTH_CONNECT, reader)
export const createGarminProvider = reader => createHealthProvider(HEALTH_SOURCES.GARMIN, reader)
export const createFitbitProvider = reader => createHealthProvider(HEALTH_SOURCES.FITBIT, reader)
export const createPolarProvider = reader => createHealthProvider(HEALTH_SOURCES.POLAR, reader)
export const createOuraProvider = reader => createHealthProvider(HEALTH_SOURCES.OURA, reader)
export const createManualEntryProvider = entries => createHealthProvider(HEALTH_SOURCES.MANUAL, async () => entries)

