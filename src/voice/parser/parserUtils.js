import { parseSwedishNumber } from './numberParser.js'

export function normalizeTranscript(transcript) {
  return String(transcript ?? '').toLowerCase().replace(/[!?;:]/g, '').replace(/\s+/g, ' ').trim()
}

export function firstCapturedNumber(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return parseSwedishNumber(match.groups?.value ?? match[1])
  }
  return null
}

export function contextWeight(context) {
  const candidates = [context.plannedWeight, context.plannedWeightKg, context.currentSet?.weightKg, context.currentSet?.kg, context.previousSet?.weightKg, context.previousSet?.kg]
  const found = candidates.map(Number).find(Number.isFinite)
  return found ?? null
}
