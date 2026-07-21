import http from 'node:http'

const PORT = Number(process.env.ATLAS_API_PORT || 8787)
const ENABLED = process.env.ATLAS_OPENAI_ENABLED === 'true'
const API_KEY = process.env.OPENAI_API_KEY
const MODEL = process.env.OPENAI_MODEL

const SYSTEM_INSTRUCTIONS = `You are ATLAS Coach, a cautious fitness coaching assistant.
Use the supplied ATLAS profile and local context as the source of truth.
Answer in Swedish unless the user writes in another language.
Explain why you recommend something.
Do not diagnose illness or injury. For sharp, increasing, neurological, chest-related or otherwise serious symptoms, recommend appropriate medical assessment.
Keep the answer practical and concise.`

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  })
  res.end(JSON.stringify(body))
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (raw.length > 100_000) throw new Error('Request too large')
  return raw ? JSON.parse(raw) : {}
}

function buildInput({ message, profile, context }) {
  return [
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: JSON.stringify({
            userMessage: message,
            atlasProfile: profile || {},
            atlasContext: context || {}
          })
        }
      ]
    }
  ]
}

function extractReply(payload) {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && typeof content.text === 'string') {
        return content.text.trim()
      }
    }
  }

  return ''
}

async function callOpenAI(body) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      instructions: SYSTEM_INSTRUCTIONS,
      input: buildInput(body),
      store: false
    })
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload?.error?.message || `OpenAI request failed (${response.status})`
    throw new Error(message)
  }

  return {
    reply: extractReply(payload),
    requestId: response.headers.get('x-request-id')
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/coach/status') {
    return sendJson(res, 200, {
      prepared: true,
      enabled: ENABLED,
      configured: Boolean(API_KEY && MODEL)
    })
  }

  if (req.method !== 'POST' || req.url !== '/api/coach') {
    return sendJson(res, 404, { error: 'Not found' })
  }

  if (!ENABLED) {
    return sendJson(res, 503, { error: 'ChatGPT integration is prepared but disabled.' })
  }

  if (!API_KEY || !MODEL) {
    return sendJson(res, 503, { error: 'Server configuration is incomplete.' })
  }

  try {
    const body = await readJson(req)
    if (typeof body.message !== 'string' || !body.message.trim()) {
      return sendJson(res, 400, { error: 'A message is required.' })
    }

    const result = await callOpenAI(body)
    if (!result.reply) throw new Error('OpenAI returned an empty answer.')
    return sendJson(res, 200, result)
  } catch (error) {
    console.error('[ATLAS OpenAI proxy]', error)
    return sendJson(res, 500, { error: 'Coach request failed.' })
  }
})

server.listen(PORT, () => {
  console.log(`ATLAS API listening on http://localhost:${PORT}`)
  console.log(`ChatGPT integration: ${ENABLED ? 'enabled' : 'disabled'}`)
})
