const API_PATH = '/api/coach'

export function getChatGptStatus() {
  const enabled = import.meta.env.VITE_ATLAS_CHATGPT_ENABLED === 'true'
  return {
    provider: 'openai',
    prepared: true,
    enabled,
    mode: enabled ? 'server-proxy' : 'local-only'
  }
}

export async function askChatGpt({ message, profile, context = {}, signal }) {
  const status = getChatGptStatus()

  if (!status.enabled) {
    throw new Error('ChatGPT-adaptern är förberedd men inte aktiverad.')
  }

  const response = await fetch(API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, profile, context }),
    signal
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || 'ChatGPT-anropet misslyckades.')
  }

  if (typeof payload.reply !== 'string' || !payload.reply.trim()) {
    throw new Error('ChatGPT-servern returnerade inget användbart svar.')
  }

  return {
    reply: payload.reply,
    provider: 'openai',
    requestId: payload.requestId || null
  }
}
