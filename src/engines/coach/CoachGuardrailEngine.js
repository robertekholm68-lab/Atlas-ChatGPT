const MEDICAL = /\b(you have|i diagnose|the diagnosis is|this is definitely|cures? your|treats? your)\b/i
const GUARANTEE = /\b(guarantee|will definitely|certainly will|promise)\b/i
const UNSAFE = /\b(push through (?:the )?pain|ignore (?:the )?(?:pain|symptoms)|train despite)\b/i
export function inspectCoachResponse(text, { knownData = [], safetyStop = false } = {}) {
  const errors = []
  if (MEDICAL.test(text)) errors.push('prohibited_medical_claim')
  if (GUARANTEE.test(text)) errors.push('outcome_promise')
  if (UNSAFE.test(text)) errors.push('unsafe_guidance')
  if (safetyStop && /\b(start|continue|complete) (?:the )?(?:workout|exercise|session)\b/i.test(text)) errors.push('contradicts_safety_decision')
  const measurements = [...String(text).matchAll(/\b\d+(?:\.\d+)?\s*(?:kg|lb|bpm|kcal|calories|%)\b/gi)].map(match => match[0].toLowerCase())
  measurements.filter(value => !knownData.map(String).map(x => x.toLowerCase()).includes(value)).forEach(() => errors.push('invented_measurement'))
  return { valid: errors.length === 0, errors: [...new Set(errors)] }
}
