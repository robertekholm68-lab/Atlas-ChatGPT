import { SWEDISH_NUMBER_SOURCE } from '../numberParser.js'
import { firstCapturedNumber } from '../parserUtils.js'

const number = `(?<value>${SWEDISH_NUMBER_SOURCE})`
const patterns = [
  new RegExp(`\\brpe\\s+${number}\\b`),
  new RegExp(`${number}\\s+(?:i|på)\\s+rpe\\b`),
  new RegExp(`\\bansträngning(?:en)?\\s+${number}\\b`),
  new RegExp(`^(?:den|det) var ${number}$`)
]

export const RPEMatcher = Object.freeze({
  name: 'RPEMatcher',
  match: ({ text }) => {
    const rpe = firstCapturedNumber(text, patterns)
    return rpe == null ? null : { rpe }
  }
})
