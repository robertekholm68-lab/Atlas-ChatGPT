import assert from 'node:assert/strict'
import test from 'node:test'
import { parseSwedishNumber, parseSwedishWorkoutCommand, workoutCommandMatchers } from '../src/voice/parseSwedishWorkoutCommand.js'
import { validateVoiceLogCommand } from '../src/voice/validateVoiceLogCommand.js'

const context = { exerciseId: 'bench', exerciseName: 'Bänkpress', currentSet: 2, plannedWeight: 75, plannedReps: 8, previousSet: { weightKg: 72.5, reps: 8 }, previousPerformance: null, availableSets: 4 }
const parse = transcript => parseSwedishWorkoutCommand(transcript, context)

const repCases = [
  ['åtta', 8], ['8', 8], ['åtta reps', 8], ['8 reps', 8], ['åtta repetitioner', 8],
  ['det blev åtta', 8], ['jag fick sex', 6], ['jag fick bara sex', 6], ['bara sex', 6],
  ['klarade tio', 10], ['jag klarade tio', 10], ['där satt tio', 10], ['kör tio', 10],
  ['tolv reps', 12], ['noll reps', 0], ['tjugo repetitioner', 20], ['100 reps', 100]
]
for (const [transcript, expected] of repCases) test(`reps: ${transcript}`, () => {
  const result = parse(transcript)
  assert.equal(result.intent, 'log_set')
  assert.equal(result.currentSet.reps, expected)
  assert.equal(result.currentSet.weightKg, 75)
  assert.equal(result.currentSet.completed, true)
})

const weightCases = [
  ['75 kilo', 75, false], ['75 kg', 75, false], ['sjuttiofem kilo', 75, false],
  ['sjuttio fem kilo', 75, false], ['80 kilogram', 80, false], ['hundra kg', 100, false],
  ['sextio och ett halvt kilo', 60.5, false], ['82,5 kg', 82.5, false], ['82.5 kilo', 82.5, false],
  ['nästa 80', 80, true], ['nästa set 80', 80, true], ['80 nästa', 80, true],
  ['80 till nästa', 80, true], ['nästa 82,5 kilo', 82.5, true]
]
for (const [transcript, expected, isNext] of weightCases) test(`vikt: ${transcript}`, () => {
  const result = parse(transcript)
  assert.equal(isNext ? result.nextSet.weightKg : result.currentSet.weightKg, expected)
  assert.equal(result.intent, isNext ? 'update_next_set' : 'log_set')
})

const rpeCases = [
  ['RPE åtta', 8], ['RPE 8', 8], ['RPE nio', 9], ['nio i RPE', 9],
  ['åtta på RPE', 8], ['ansträngning åtta', 8], ['ansträngningen nio', 9],
  ['den var nia', 9], ['den var åtta', 8], ['det var nio', 9], ['RPE tio', 10], ['tio i RPE', 10]
]
for (const [transcript, expected] of rpeCases) test(`RPE: ${transcript}`, () => assert.equal(parse(transcript).currentSet.rpe, expected))

const increaseCases = [
  ['öka två och ett halvt', 2.5], ['öka 2,5', 2.5], ['lägg på fem', 5], ['plus fem', 5],
  ['två och ett halvt upp', 2.5], ['fem mer', 5], ['höj fem', 5], ['+2,5', 2.5],
  ['lägg på 5 kg', 5], ['öka tio', 10], ['höj två', 2], ['tio upp', 10]
]
for (const [transcript, expected] of increaseCases) test(`viktökning: ${transcript}`, () => {
  const result = parse(transcript)
  assert.equal(result.intent, 'update_next_set')
  assert.equal(result.nextSet.weightDeltaKg, expected)
  assert.equal(result.currentSet.weightKg, null)
})

const decreaseCases = [
  ['minus fem', -5], ['sänk fem', -5], ['fem mindre', -5], ['två och ett halvt ner', -2.5],
  ['dra av fem', -5], ['sänk 2,5', -2.5], ['-5', -5], ['fem ned', -5],
  ['minus tio', -10], ['sänk tio kilo', -10], ['dra av 2,5 kg', -2.5]
]
for (const [transcript, expected] of decreaseCases) test(`viktsänkning: ${transcript}`, () => assert.equal(parse(transcript).nextSet.weightDeltaKg, expected))

const sameCases = [
  ['samma vikt', false], ['behåll vikten', false], ['oförändrad vikt', false], ['samma vikt nästa', true],
  ['samma nästa', true], ['behåll vikten nästa', true], ['samma vikt till nästa', true],
  ['oförändrad vikt nästa set', true], ['nästa set samma vikt', true]
]
for (const [transcript, isNext] of sameCases) test(`samma vikt: ${transcript}`, () => {
  const result = parse(transcript)
  assert.equal(isNext ? result.nextSet.weightKg : result.currentSet.weightKg, 75)
})

for (const transcript of ['klart', 'set klart', 'markera klart', 'färdig', 'klar', 'setet är klart', 'det är klart']) {
  test(`klart: ${transcript}`, () => assert.equal(parse(transcript).currentSet.completed, true))
}

for (const transcript of ['nästa', 'nästa set', 'till nästa', 'öka nästa']) {
  test(`nästa set: ${transcript}`, () => assert.equal(parse(transcript).intent, 'next_set'))
}

for (const transcript of ['avbryt', 'ångra', 'glöm det', 'inte den', 'strunta i det', 'ta bort det']) {
  test(`avbryt: ${transcript}`, () => {
    const result = parse(transcript)
    assert.equal(result.intent, 'cancel')
    assert.deepEqual(result.warnings, [])
  })
}

const unknownCases = ['bra jobbat', 'nu kör vi', 'bänkpress', 'ganska tungt', 'kanske åtta eller nio', 'lägg in det', 'vad är nästa övning', 'lite mindre tror jag', '', null]
for (const transcript of unknownCases) test(`okänt: ${String(transcript)}`, () => {
  const result = parse(transcript)
  assert.equal(result.intent, 'UnknownIntent')
  assert.equal(result.confidence, 0)
  assert.ok(result.warnings.includes('unrecognized_command'))
})

test('blandad vikt och reps fungerar oavsett ordning', () => {
  assert.deepEqual(parse('75 kilo åtta reps').currentSet, { weightKg: 75, reps: 8, rpe: null, completed: true })
  assert.deepEqual(parse('åtta reps 75 kilo').currentSet, { weightKg: 75, reps: 8, rpe: null, completed: true })
})

test('blandad vikt, reps och RPE ger ett log_set', () => {
  const result = parse('75 kg 8 reps RPE nio')
  assert.deepEqual(result.currentSet, { weightKg: 75, reps: 8, rpe: 9, completed: true })
  assert.equal(result.intent, 'log_set')
})

test('viktgränser, repsgränser och RPE-gränser valideras', () => {
  assert.ok(parse('501 kilo').warnings.includes('weight_out_of_range'))
  assert.ok(parse('101 reps').warnings.includes('reps_out_of_range'))
  assert.ok(parse('RPE 11').warnings.includes('rpe_out_of_range'))
  assert.equal(parse('-5 kilo').currentSet.weightKg, null)
})

test('extrem viktförändring ger warning men är inte blockerande', () => {
  const parsed = parse('plus femtio')
  assert.ok(parsed.warnings.includes('extreme_weight_change'))
  assert.equal(validateVoiceLogCommand(parsed, context).valid, true)
})

test('samma vikt utan kontext gissas inte', () => {
  const result = parseSwedishWorkoutCommand('samma vikt', {})
  assert.equal(result.currentSet.weightKg, null)
  assert.ok(result.warnings.includes('missing_context_weight'))
})

test('alla matchers är namngivna, isolerade objekt', () => {
  assert.deepEqual(workoutCommandMatchers.map(matcher => matcher.name), ['CancelMatcher', 'RPEMatcher', 'WeightAdjustmentMatcher', 'WeightMatcher', 'RepMatcher', 'CompletionMatcher', 'NextSetMatcher', 'UnknownMatcher'])
  assert.ok(workoutCommandMatchers.every(matcher => typeof matcher.match === 'function'))
})

const numberCases = [['sjuttiofem', 75], ['sjuttio fem', 75], ['åttio två', 82], ['två och ett halvt', 2.5], ['2,5', 2.5], ['+5', 5], ['nia', 9]]
for (const [input, expected] of numberCases) test(`svenskt tal: ${input}`, () => assert.equal(parseSwedishNumber(input), expected))
