import test from 'node:test'
import assert from 'node:assert/strict'
import { runASKRIntelligence, buildASKRContext, createAction, createFeedback, storeFeedback, validateAction } from '../src/engines/askr/index.js'
import { makeCoachDecision } from '../src/engines/CoachDecisionEngine.js'
import { askrScenarios } from './fixtures/askrScenarios.js'

test('normalizes and freezes context without copying domain databases', () => { const context = buildASKRContext({ ...askrScenarios.excellentRecovery, userProfile: { id: 'u1', secret: 'no' } }); assert.deepEqual(context.userProfile, { id: 'u1' }); assert.ok(Object.isFrozen(context)) })
test('safety takes precedence and conflicting advice does not reach decisions', () => { const result = runASKRIntelligence(askrScenarios.possibleIllness); assert.equal(result.decisions[0].safetyLevel, 'caution'); assert.equal(result.decisions[0].supportingSignals[0].type, 'POSSIBLE_ILLNESS') })
test('resolves volume, nutrition, and muscle conflicts deterministically', () => {
  const nutrition = runASKRIntelligence(askrScenarios.deficitRecoveryConflict); assert.equal(nutrition.trace.conflictsResolved.length, 1); assert.ok(!nutrition.decisions.some(item => item.supportingSignals[0].type === 'MAINTAIN_CALORIE_DEFICIT'))
  const muscles = runASKRIntelligence(askrScenarios.overloadedLegs); assert.equal(muscles.trace.conflictsResolved[0].winningRecommendation.type, 'MUSCLE_OVERLOADED')
  assert.deepEqual(runASKRIntelligence(askrScenarios.overloadedLegs), muscles)
})
test('briefing limits actions and selects an achievable next action', () => { const result = runASKRIntelligence(askrScenarios.twentyMinutes); assert.ok(result.briefing.topActions.length <= 3); assert.ok(result.nextBestAction); assert.ok(result.nextBestAction.payload.duration <= 20) })
test('actions enforce confirmation boundary and feedback is stored without changing weights', () => { assert.equal(validateAction({ type: 'UPDATE_GOAL', payload: {}, requiresConfirmation: false }).valid, false); assert.equal(createAction('OPEN_SCREEN', { screen: 'coach' }).requiresConfirmation, false); const input = { decisionId: 'd1', type: 'HELPFUL', timestamp: '2026-07-27T08:00:00.000Z' }; assert.equal(createFeedback(input).type, 'HELPFUL'); assert.equal(storeFeedback([], input).length, 1) })
test('manual-only users retain useful confidence and coach consumes ASKR decisions', () => { const result = runASKRIntelligence(askrScenarios.manualOnly); assert.ok(result.decisions[0].confidence.score >= 0.2); assert.equal(makeCoachDecision({ askr: result }).askrDecisionId, result.decisions[0].id) })
