import { AIProvider } from './AIProvider.js'
export class RemoteAIProvider extends AIProvider {
  constructor({ endpoint, enabled = false, fetchImplementation = globalThis.fetch } = {}) { super(); this.endpoint = endpoint; this.enabled = enabled; this.fetch = fetchImplementation }
  isAvailable() { return Boolean(this.enabled && this.endpoint && this.fetch) }
  async generate({ plan, context }) {
    if (!this.isAvailable()) throw new Error('Remote AI is disabled')
    const response = await this.fetch(this.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ plan, context }) })
    if (!response.ok) throw new Error('Remote AI request failed')
    const result = await response.json(); return String(result.text || '')
  }
}
