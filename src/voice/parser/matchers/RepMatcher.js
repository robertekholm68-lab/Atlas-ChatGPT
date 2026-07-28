import { SWEDISH_NUMBER_SOURCE, parseSwedishNumber } from '../numberParser.js'
import { firstCapturedNumber } from '../parserUtils.js'

const value = `(?<value>${SWEDISH_NUMBER_SOURCE})`
const patterns = [
  new RegExp(`${value}\\s*(?:reps?|repetitioner?)\\b`),
  new RegExp(`(?:det blev|jag fick(?: bara)?|jag klarade|klarade|bara|där satt|kör)\\s+${value}\\b`)
]

export const RepMatcher = Object.freeze({
  name: 'RepMatcher',
  match: ({ text, hasSpecializedMatch, targetsNext }) => {
    const explicit = firstCapturedNumber(text, patterns)
    if (explicit != null) return { reps: explicit, completed: true }
    if (targetsNext || hasSpecializedMatch) return null
    const bare = parseSwedishNumber(text)
    return bare == null ? null : { reps: bare, completed: true, ambiguous: true }
  }
})
