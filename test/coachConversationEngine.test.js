import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyCoachIntent } from '../src/engines/coach/CoachIntentEngine.js'
import { buildCoachContext } from '../src/engines/coach/CoachContextBuilder.js'
import { inspectCoachResponse } from '../src/engines/coach/CoachGuardrailEngine.js'
import { createCoachMemory, removeCoachMemory } from '../src/engines/coach/CoachMemoryEngine.js'
import { CoachConversationEngine } from '../src/engines/coach/CoachConversationEngine.js'
import { RemoteAIProvider } from '../src/adapters/ai/RemoteAIProvider.js'

test('classifies supported workout, nutrition, and pain intents with confidence', () => {
  assert.equal(classifyCoachIntent('Make me a 30-minute workout').intent, 'CREATE_WORKOUT_PLAN')
  assert.equal(classifyCoachIntent('Help with my protein target').intent, 'REVIEW_NUTRITION')
  assert.equal(classifyCoachIntent('My shoulder hurts').intent, 'REPORT_SYMPTOM')
  assert.equal(classifyCoachIntent('hello').requiresClarification, true)
})
test('minimizes context by intent and strips identifiers and raw notes', () => {
  const state={training:{summary:'two sessions',history:[1]},recovery:{score:70},nutrition:{protein:90},profile:{email:'private@example.com',availableEquipment:['dumbbells'],medicalNotes:'private'}}
  const context=buildCoachContext('SUGGEST_WORKOUT',state,[])
  assert.deepEqual(Object.keys(context).sort(),['intent','decisions','profile','recovery','training'].sort())
  assert.equal(context.profile.email,undefined); assert.equal(context.profile.medicalNotes,undefined)
})
test('guardrails reject diagnoses, guarantees, invented measurements, and unsafe guidance', () => {
  const result=inspectCoachResponse('You have a strain. I guarantee success at 200 kg; push through pain.')
  assert.equal(result.valid,false); assert.ok(result.errors.includes('prohibited_medical_claim')); assert.ok(result.errors.includes('invented_measurement')); assert.ok(result.errors.includes('unsafe_guidance'))
})
test('confirmed preference memory can be created and deleted', () => {
  const memory=createCoachMemory({category:'exercise_dislike',value:'burpees',source:'user',confidence:.9,userConfirmed:true},'2026-01-01T00:00:00.000Z')
  assert.equal(memory.userConfirmed,true); assert.deepEqual(removeCoachMemory([memory],memory.id),[])
  assert.throws(()=>createCoachMemory({category:'exercise_dislike',value:'burpees'}))
})
test('offline provider produces a plan-conforming safety response without actions', async () => {
  const result=await new CoachConversationEngine({provider:new RemoteAIProvider({enabled:false})}).respond({message:'My shoulder hurts',applicationState:{training:{today:'press'}},decisions:[]})
  assert.equal(result.provider,'MockAIProvider'); assert.equal(result.validation.valid,true); assert.equal(result.proposedActions.length,0); assert.match(result.text,/cannot diagnose/i)
})
