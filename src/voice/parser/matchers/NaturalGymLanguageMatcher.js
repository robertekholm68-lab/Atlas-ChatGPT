import { SWEDISH_NUMBER_SOURCE, parseSwedishNumber } from '../numberParser.js'
import { currentWeight, plannedWeight } from '../parserUtils.js'

const number = `(${SWEDISH_NUMBER_SOURCE})`
const pair = new RegExp(`(?:^|\\b)(?:kör|jag gjorde)?\\s*${number}(?:(?:\\s*(?:gånger|x|på|för|och)\\s*)|(?:,\\s+)|(?:\\s+))${number}(?:\\s*(?:reps?|repetitioner?))?(?:$|[.!?])`, 'i')

function previousSet(context) {
  const previous = context.previousSet || context.previousValues
  if (!previous) return null
  return {
    weightKg: Number(previous.weightKg ?? previous.kg ?? previous.weight),
    reps: Number(previous.reps),
    rpe: Number(previous.rpe)
  }
}

export const NaturalGymLanguageMatcher = Object.freeze({
  name: 'NaturalGymLanguageMatcher',
  match: ({ text, context }) => {
    const values = text.match(pair)
    if (values) return { intent: 'log_set', weightKg: parseSwedishNumber(values[1]), reps: parseSwedishNumber(values[2]), completed: true }

    if (/^(?:samma igen|likadant)$/.test(text)) {
      const previous = previousSet(context)
      return previous && [previous.weightKg, previous.reps].every(Number.isFinite)
        ? { intent: 'copy_previous_set', ...previous, completed: true }
        : { intent: 'copy_previous_set', warning: 'missing_previous_set' }
    }
    if (/^en till$/.test(text)) return { intent: 'add_sets', setCount: 1, copyPrevious: true }
    const additionalSets = text.match(new RegExp(`^${number}\\s+set till(?:\\s+på\\s+${number})?$`))
    if (additionalSets) return { intent: 'add_sets', setCount: parseSwedishNumber(additionalSets[1]), weightKg: parseSwedishNumber(additionalSets[2]), copyPrevious: true }
    if (/^missade sista$/.test(text)) return { intent: 'mark_last_set_failed' }
    if (/^ta bort sista$/.test(text)) return { intent: 'remove_last_set' }
    if (/^ångra$/.test(text)) return { intent: 'undo_voice_operation' }

    if (/^[+-]/.test(text)) return null
    const bare = parseSwedishNumber(text)
    if (bare == null) return null
    const activeWeight = currentWeight(context)
    const targetWeight = plannedWeight(context)
    if (activeWeight != null && targetWeight != null && activeWeight !== targetWeight && bare === targetWeight) {
      const reps = Number(context.currentSet?.reps ?? context.plannedReps ?? context.previousSet?.reps)
      return { intent: 'log_set', weightKg: bare, reps: Number.isFinite(reps) ? reps : null, completed: false }
    }
    if (activeWeight != null) return { intent: 'log_set', weightKg: activeWeight, reps: bare, completed: true }
    return { intent: 'log_set', reps: bare, completed: true, warning: 'ambiguous_number' }
  }
})
