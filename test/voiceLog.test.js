import test from 'node:test'
import assert from 'node:assert/strict'
import { parseSwedishWorkoutCommand } from '../src/voice/parseSwedishWorkoutCommand.js'
import { validateVoiceLogCommand } from '../src/voice/validateVoiceLogCommand.js'
import { createSpeechRecognitionAdapter } from '../src/voice/speechRecognitionAdapter.js'
import { applyVoiceLogCommand } from '../src/voice/applyVoiceLogCommand.js'
import { startWorkout } from '../src/workoutSessionModel.js'

const context = { exerciseId:'bench', exerciseName:'Bänkpress', currentSetIndex:1, plannedWeightKg:75, plannedReps:8, previousSet:{kg:75,reps:8,rpe:8}, previousPerformance:'75 × 8', availableSetCount:3 }
const parse = transcript => validateVoiceLogCommand(parseSwedishWorkoutCommand(transcript, context), context)

test('tolkar svenska vikt-, repetitions- och RPE-kommandon deterministiskt', () => {
  let result = parse('75 kilo 8 reps')
  assert.deepEqual([result.currentSet.weightKg,result.currentSet.reps,result.currentSet.completed],[75,8,true])
  result = parse('sjuttiofem kilo och åtta repetitioner')
  assert.deepEqual([result.currentSet.weightKg,result.currentSet.reps],[75,8])
  assert.equal(parse('det blev åtta').currentSet.reps,8)
  result = parse('sex reps RPE nio')
  assert.deepEqual([result.currentSet.reps,result.currentSet.rpe],[6,9])
  result = parse('samma vikt tio reps')
  assert.deepEqual([result.currentSet.weightKg,result.currentSet.reps],[75,10])
})

test('tolkar relativa och absoluta ändringar för nästa set', () => {
  assert.equal(parse('öka två och ett halvt till nästa set').nextSet.weightDeltaKg,2.5)
  assert.equal(parse('lägg på fem').nextSet.weightDeltaKg,5)
  assert.equal(parse('sänk fem nästa').nextSet.weightDeltaKg,-5)
  assert.equal(parse('nästa set 80 kilo').nextSet.weightKg,80)
  assert.equal(parse('samma vikt nästa set').nextSet.weightKg,75)
})

test('tolkar decimal, klart och kontextuellt ensamt tal', () => {
  assert.equal(parse('77,5 kilo').currentSet.weightKg,77.5)
  assert.equal(parse('klart').currentSet.completed,true)
  const result=parse('åtta')
  assert.deepEqual([result.currentSet.weightKg,result.currentSet.reps],[75,8])
})

test('avvisar obegripliga, tvetydiga och osäkra värden', () => {
  assert.equal(parse('bananen flög snabbt').valid,false)
  assert.equal(parse('fem eller sex kanske').valid,false)
  assert.equal(parse('-5 kilo').valid,false)
  assert.equal(parse('RPE elva').valid,false)
})

test('unsupported adapter avvisar säkert', async () => {
  const adapter=createSpeechRecognitionAdapter({environment:{}})
  assert.equal(adapter.supported,false)
  await assert.rejects(adapter.start(),error=>error.code==='unsupported')
})

test('adapter hanterar nekad behörighet, avbrott och tom transkription', async () => {
  class Recognition {
    start(){ queueMicrotask(()=>this.onerror({error:'not-allowed'})) }
    stop(){} abort(){this.aborted=true}
  }
  const denied=createSpeechRecognitionAdapter({environment:{SpeechRecognition:Recognition}})
  await assert.rejects(denied.start(),error=>error.code==='permission_denied')
  class NoMatch extends Recognition { start(){queueMicrotask(()=>this.onnomatch())} }
  const empty=createSpeechRecognitionAdapter({environment:{SpeechRecognition:NoMatch}})
  await assert.rejects(empty.start(),error=>error.code==='no_transcript')
  empty.abort()
})

test('bekräftelse använder workout engine medan avbryt inte muterar', () => {
  const library=[{id:'bench',name:'Bänkpress',targetSets:2,restDurationSeconds:90}]
  const session=startWorkout({name:'Test',exercises:['bench']},library,{now:100,previousValues:{bench:{kg:75,reps:6}}})
  const command=parse('75 kilo 8 reps RPE åtta')
  const updated=applyVoiceLogCommand(session,0,0,command,200,true)
  assert.deepEqual([updated.exercises[0].sets[0].kg,updated.exercises[0].sets[0].reps,updated.exercises[0].sets[0].rpe,updated.exercises[0].sets[0].done],[75,8,8,true])
  assert.equal(updated.restTimer.status,'running')
  assert.equal(session.exercises[0].sets[0].done,false)
  assert.equal(applyVoiceLogCommand(session,0,0,null),session)
})
