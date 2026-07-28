import { SWEDISH_NUMBER_SOURCE } from '../numberParser.js'
import { contextWeight, firstCapturedNumber } from '../parserUtils.js'

const value = `(?<value>${SWEDISH_NUMBER_SOURCE})`
const explicit = [new RegExp(`${value}\\s*(?:kg|kilo|kilogram)\\b`)]
const nextPosition = [new RegExp(`^${value}\\s+(?:till )?nästa(?: set)?$`), new RegExp(`^nästa(?: set)?\\s+${value}(?:\\s*(?:kg|kilo))?$`)]

export const WeightMatcher = Object.freeze({
  name: 'WeightMatcher',
  match: ({ text, context, targetsNext }) => {
    const same = /\b(?:samma(?: vikt)?|behåll vikten|oförändrad vikt)\b/.test(text)
    if (same) {
      const weightKg = contextWeight(context)
      return targetsNext ? { nextWeightKg: weightKg, sameWeight: true } : { weightKg, sameWeight: true }
    }
    const positioned = firstCapturedNumber(text, nextPosition)
    if (positioned != null) return { nextWeightKg: positioned, targetsNext: true }
    const weight = firstCapturedNumber(text, explicit)
    if (weight == null) return null
    return targetsNext ? { nextWeightKg: weight } : { weightKg: weight }
  }
})
