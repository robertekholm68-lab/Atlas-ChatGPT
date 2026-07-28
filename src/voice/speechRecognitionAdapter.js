export const VOICE_LOG_STATUS = Object.freeze({ IDLE:'idle', REQUESTING_PERMISSION:'requesting_permission', LISTENING:'listening', PROCESSING:'processing', PREVIEW:'preview', SUCCESS:'success', ERROR:'error', UNSUPPORTED:'unsupported' })

export function createSpeechRecognitionAdapter({ environment = globalThis, nativeAdapter = null, timeoutMs = 10000 } = {}) {
  if (nativeAdapter) return nativeAdapter
  const Recognition = environment?.SpeechRecognition || environment?.webkitSpeechRecognition
  if (!Recognition) return { supported: false, start: async () => { const error = new Error('unsupported'); error.code = 'unsupported'; throw error }, stop() {}, abort() {} }
  let recognition
  let timeout
  return {
    supported: true,
    start({ language = 'sv-SE', onStatus = () => {}, onResult = () => {}, onError = () => {} } = {}) {
      return new Promise((resolve, reject) => {
        let settled = false
        recognition = new Recognition()
        recognition.lang = language
        recognition.continuous = false
        recognition.interimResults = false
        recognition.maxAlternatives = 1
        const fail = code => { if (settled) return; settled = true; clearTimeout(timeout); const error = new Error(code); error.code = code; onError(error); reject(error) }
        recognition.onstart = () => onStatus(VOICE_LOG_STATUS.LISTENING)
        recognition.onresult = event => {
          const result = event.results?.[event.resultIndex || 0]
          if (!result?.isFinal) return
          clearTimeout(timeout)
          const transcript = result[0]?.transcript?.trim() || ''
          onStatus(VOICE_LOG_STATUS.PROCESSING)
          if (!transcript) return fail('no_transcript')
          settled = true; recognition.stop(); onResult(transcript); resolve(transcript)
        }
        recognition.onerror = event => fail(event.error === 'not-allowed' ? 'permission_denied' : event.error || 'recognition_error')
        recognition.onnomatch = () => fail('no_transcript')
        recognition.onend = () => fail('no_transcript')
        onStatus(VOICE_LOG_STATUS.REQUESTING_PERMISSION)
        recognition.start()
        timeout = setTimeout(() => recognition.stop(), timeoutMs)
      })
    },
    stop() { clearTimeout(timeout); recognition?.stop() },
    abort() { clearTimeout(timeout); recognition?.abort() }
  }
}
