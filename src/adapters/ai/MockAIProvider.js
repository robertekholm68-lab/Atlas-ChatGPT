import { AIProvider } from './AIProvider.js'
export class MockAIProvider extends AIProvider {
  isAvailable() { return true }
  async generate({ plan }) { return [plan.directAnswer, ...plan.explanationPoints, ...plan.warnings, plan.followUpQuestion].filter(Boolean).join(' ') }
}
