import { SWEDISH_NUMBER_SOURCE } from '../numberParser.js'
import { firstCapturedNumber } from '../parserUtils.js'

const value = `(?<value>${SWEDISH_NUMBER_SOURCE})`
const increase = [new RegExp(`(?:öka|höj|lägg på|plus)\\s*${value}`), new RegExp(`${value}\\s+(?:upp|mer)$`), /^\+(?<value>\d+(?:[,.]\d+)?)$/]
const decrease = [new RegExp(`(?:sänk|minus|dra av)\\s*${value}`), new RegExp(`${value}\\s+(?:ner|ned|mindre)$`), /^-(?<value>\d+(?:[,.]\d+)?)$/]

export const WeightAdjustmentMatcher = Object.freeze({
  name: 'WeightAdjustmentMatcher',
  match: ({ text }) => {
    const up = firstCapturedNumber(text, increase)
    if (up != null) return { weightDeltaKg: Math.abs(up), targetsNext: true }
    const down = firstCapturedNumber(text, decrease)
    return down == null ? null : { weightDeltaKg: -Math.abs(down), targetsNext: true }
  }
})
