const SMALL_NUMBERS = Object.freeze({
  noll: 0, en: 1, ett: 1, två: 2, tre: 3, fyra: 4, fem: 5, sex: 6,
  sju: 7, åtta: 8, nio: 9, nia: 9, tio: 10, elva: 11, tolv: 12,
  tretton: 13, fjorton: 14, femton: 15, sexton: 16, sjutton: 17,
  arton: 18, nitton: 19
})

const TENS = Object.freeze({ tjugo: 20, trettio: 30, fyrtio: 40, femtio: 50, sextio: 60, sjuttio: 70, åttio: 80, nittio: 90 })

export const SWEDISH_NUMBER_SOURCE = String.raw`(?:[-+]?\d+(?:[,.]\d+)?|(?:sjutton|arton|nitton|fjorton|femton|sexton|tretton|trettio|fyrtio|femtio|sextio|sjuttio|åttio|nittio|hundra|tjugo|elva|tolv|noll|åtta|nio|nia|tio|fyra|fem|en|ett|två|tre|sex|sju)(?:[ -]?(?:åtta|nio|fyra|fem|en|ett|två|tre|sex|sju))?(?: och (?:en|ett) halvt)?)`

function parseWholeWord(value) {
  if (SMALL_NUMBERS[value] != null) return SMALL_NUMBERS[value]
  if (TENS[value] != null) return TENS[value]
  if (value === 'hundra') return 100
  for (const [word, tens] of Object.entries(TENS)) {
    if (value.startsWith(word) && SMALL_NUMBERS[value.slice(word.length)] > 0) return tens + SMALL_NUMBERS[value.slice(word.length)]
  }
  return null
}

export function parseSwedishNumber(input) {
  if (typeof input !== 'string') return null
  const value = input.trim().toLowerCase().replace(',', '.').replace(/-/g, ' ')
  if (/^[-+]?\d+(?:\.\d+)?$/.test(value)) return Number(value)
  const half = value.match(/^(.+?) och (?:en|ett) halvt$/)
  if (half) {
    const whole = parseSwedishNumber(half[1])
    return whole == null ? null : whole + 0.5
  }
  const words = value.split(/\s+/)
  if (words.length === 1) return parseWholeWord(words[0])
  let total = 0
  for (const word of words) {
    const parsed = parseWholeWord(word)
    if (parsed == null) return null
    total += parsed
  }
  return total
}
