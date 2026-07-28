const SIMPLE_NUMBERS = {
  noll: 0, en: 1, ett: 1, två: 2, tre: 3, fyra: 4, fem: 5, sex: 6,
  sju: 7, åtta: 8, nio: 9, tio: 10, elva: 11, tolv: 12, tretton: 13,
  fjorton: 14, femton: 15, sexton: 16, sjutton: 17, arton: 18, nitton: 19,
  tjugo: 20, trettio: 30, fyrtio: 40, femtio: 50, sextio: 60,
  sjuttio: 70, åttio: 80, nittio: 90, hundra: 100
}

const UNIT_WORD = '(?:kilo(?:gram)?|kg)'
const REP_WORD = '(?:reps?|repetitioner?)'
const NUMBER_TOKEN = '-?\\d+(?:[,.]\\d+)?|[a-zåäö]+(?: och (?:en|ett) halvt)?'

function compactNumberWord(word) {
  if (SIMPLE_NUMBERS[word] != null) return SIMPLE_NUMBERS[word]
  for (const [tensWord, tens] of Object.entries(SIMPLE_NUMBERS).filter(([, value]) => value >= 20 && value < 100)) {
    if (!word.startsWith(tensWord)) continue
    const remainder = word.slice(tensWord.length)
    if (SIMPLE_NUMBERS[remainder] > 0 && SIMPLE_NUMBERS[remainder] < 10) return tens + SIMPLE_NUMBERS[remainder]
  }
  return null
}

export function parseSwedishNumber(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase().replace(',', '.').replace(/-/g, ' ')
  if (/^-?\d+(?:\.\d+)?$/.test(normalized)) return Number(normalized)
  const halfMatch = normalized.match(/^(.+?) och (?:en|ett) halvt$/)
  if (halfMatch) {
    const whole = parseSwedishNumber(halfMatch[1])
    return whole == null ? null : whole + 0.5
  }
  const words = normalized.split(/\s+/)
  if (words.length === 1) return compactNumberWord(words[0])
  let total = 0
  for (const word of words) {
    const number = compactNumberWord(word)
    if (number == null) return null
    total += number
  }
  return total
}

const valueFrom = match => match ? parseSwedishNumber(match[1]) : null
const firstMatch = (text, expressions) => expressions.map(expression => text.match(expression)).find(Boolean)

export function parseSwedishWorkoutCommand(transcript, context = {}) {
  const text = String(transcript || '').trim().toLowerCase().replace(/[!?]/g, '').replace(/\s+/g, ' ')
  const warnings = []
  const currentSet = { weightKg: null, reps: null, rpe: null, completed: false }
  const nextSet = { weightKg: null, weightDeltaKg: null }
  const targetsNext = /(?:nästa set|till nästa|nästa)$/.test(text) || /nästa set/.test(text)
  const baseWeight = Number(context.plannedWeightKg ?? context.previousSet?.weightKg ?? context.previousSet?.kg)

  const rpeMatch = firstMatch(text, [new RegExp(`rpe\\s+(${NUMBER_TOKEN})`), new RegExp(`ansträngning\\s+(${NUMBER_TOKEN})`)])
  if (rpeMatch) currentSet.rpe = valueFrom(rpeMatch)

  const explicitWeight = firstMatch(text, [
    new RegExp(`nästa set\\s+(${NUMBER_TOKEN})\\s*${UNIT_WORD}?`),
    new RegExp(`(${NUMBER_TOKEN})\\s*${UNIT_WORD}`)
  ])
  const deltaMatch = firstMatch(text, [
    new RegExp(`(?:öka|lägg på)\\s+(${NUMBER_TOKEN})(?:\\s*${UNIT_WORD})?`),
    new RegExp(`sänk\\s+(${NUMBER_TOKEN})(?:\\s*${UNIT_WORD})?`)
  ])
  const decrease = /\bsänk\b/.test(text)
  const keepWeight = /(?:samma vikt|behåll vikten)/.test(text)

  if (deltaMatch) nextSet.weightDeltaKg = (decrease ? -1 : 1) * valueFrom(deltaMatch)
  if (explicitWeight) {
    const weight = valueFrom(explicitWeight)
    if (targetsNext && text.includes('nästa set')) nextSet.weightKg = weight
    else currentSet.weightKg = weight
  } else if (keepWeight && targetsNext) {
    nextSet.weightKg = Number.isFinite(baseWeight) ? baseWeight : null
  } else if (keepWeight) {
    currentSet.weightKg = Number.isFinite(baseWeight) ? baseWeight : null
  }

  const repsMatch = firstMatch(text, [
    new RegExp(`(${NUMBER_TOKEN})\\s*${REP_WORD}`),
    new RegExp(`(?:det blev|jag klarade)\\s+(${NUMBER_TOKEN})`)
  ])
  if (repsMatch) currentSet.reps = valueFrom(repsMatch)

  const stripped = text
    .replace(new RegExp(`(?:rpe|ansträngning)\\s+(?:${NUMBER_TOKEN})`, 'g'), '')
    .replace(new RegExp(`(?:${NUMBER_TOKEN})\\s*${UNIT_WORD}`, 'g'), '')
    .replace(/(?:samma vikt|behåll vikten|klart|set klart|markera klart)/g, '')
    .trim()
  if (currentSet.reps == null && !targetsNext && !deltaMatch && stripped) {
    const onlyNumber = parseSwedishNumber(stripped.replace(/^(?:det blev|jag klarade)\s+/, ''))
    if (onlyNumber != null) currentSet.reps = onlyNumber
  }

  const explicitComplete = /^(?:klart|set klart|markera klart)$/.test(text)
  currentSet.completed = explicitComplete || currentSet.reps != null
  if (currentSet.weightKg == null && currentSet.reps != null && Number.isFinite(baseWeight)) currentSet.weightKg = baseWeight

  const recognized = [currentSet.weightKg, currentSet.reps, currentSet.rpe, nextSet.weightKg, nextSet.weightDeltaKg].some(value => value != null) || explicitComplete
  const numberCount = (text.match(/\d+(?:[,.]\d+)?|\b(?:en|ett|två|tre|fyra|fem|sex|sju|åtta|nio|tio)\b/g) || []).length
  if (!recognized) warnings.push('unrecognized_command')
  if (numberCount > 0 && !recognized) warnings.push('ambiguous_number')
  if (rpeMatch && currentSet.rpe == null) warnings.push('invalid_rpe')
  if (explicitWeight && currentSet.weightKg == null && nextSet.weightKg == null) warnings.push('invalid_weight')

  const intent = targetsNext || deltaMatch ? 'update_next_set' : 'log_set'
  const parsedFields = [currentSet.weightKg, currentSet.reps, currentSet.rpe, nextSet.weightKg, nextSet.weightDeltaKg].filter(value => value != null).length
  return {
    transcript: String(transcript || ''), intent, currentSet, nextSet,
    confidence: recognized ? Math.min(0.98, 0.72 + parsedFields * 0.08 + (currentSet.completed ? 0.08 : 0)) : 0,
    warnings, needsConfirmation: true
  }
}

