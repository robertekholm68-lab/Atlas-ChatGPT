import { classifyCoachIntent } from './CoachIntentEngine.js'
import { buildCoachContext } from './CoachContextBuilder.js'
import { buildCoachStyle } from './CoachPersonalizationEngine.js'
import { planCoachResponse } from './CoachResponsePlanner.js'
import { parseCoachActions } from './CoachActionParser.js'
import { validateAIResponse } from '../../adapters/ai/AIResponseValidator.js'
import { MockAIProvider } from '../../adapters/ai/MockAIProvider.js'

export class CoachConversationEngine {
  constructor({ provider = new MockAIProvider() } = {}) { this.provider = provider }
  async respond({ message, applicationState = {}, decisions = [], preferences = {} }) {
    const classification = classifyCoachIntent(message)
    const context = buildCoachContext(classification.intent, applicationState, decisions)
    const plan = planCoachResponse(classification, context, buildCoachStyle(preferences))
    let provider = this.provider.isAvailable() ? this.provider : new MockAIProvider()
    let text = await provider.generate({ plan, context })
    let validation = validateAIResponse(text, plan, { knownData: applicationState.knownMeasurements || [], safetyStop: classification.intent === 'REPORT_SYMPTOM' })
    if (!validation.valid && !(provider instanceof MockAIProvider)) { provider = new MockAIProvider(); text = await provider.generate({ plan, context }); validation = validateAIResponse(text, plan, { knownData: applicationState.knownMeasurements || [], safetyStop: classification.intent === 'REPORT_SYMPTOM' }) }
    return Object.freeze({ classification, context, plan, text, validation, proposedActions: classification.requiresClarification ? [] : parseCoachActions(plan), provider: provider.constructor.name })
  }
}
