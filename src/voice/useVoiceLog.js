import { useEffect, useRef, useState } from 'react'
import { createSpeechRecognitionAdapter, VOICE_LOG_STATUS } from './speechRecognitionAdapter.js'
import { parseSwedishWorkoutCommand } from './parseSwedishWorkoutCommand.js'
import { validateVoiceLogCommand } from './validateVoiceLogCommand.js'
import { logVoiceLogEvent } from './voiceLogAnalytics.js'

export function useVoiceLog(context, options = {}) {
  const adapterRef = useRef(null)
  if (!adapterRef.current) adapterRef.current = options.adapter || createSpeechRecognitionAdapter({ nativeAdapter: options.nativeAdapter })
  const [status, setStatus] = useState(adapterRef.current.supported === false ? VOICE_LOG_STATUS.UNSUPPORTED : VOICE_LOG_STATUS.IDLE)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => () => adapterRef.current?.abort(), [])

  const processTranscript = transcript => {
    setStatus(VOICE_LOG_STATUS.PROCESSING); logVoiceLogEvent('voice_log_transcribed')
    const result = validateVoiceLogCommand(parseSwedishWorkoutCommand(transcript, context), context)
    setPreview(result); setStatus(VOICE_LOG_STATUS.PREVIEW)
    logVoiceLogEvent(result.valid ? 'voice_log_parse_success' : 'voice_log_parse_failed')
    return result
  }
  const start = async () => {
    if (adapterRef.current.supported === false) { setStatus(VOICE_LOG_STATUS.UNSUPPORTED); return }
    setError(null); logVoiceLogEvent('voice_log_started')
    try { await adapterRef.current.start({ onStatus:setStatus, onResult:processTranscript, onError:setError }) }
    catch (reason) { setError(reason); setStatus(reason.code === 'unsupported' ? VOICE_LOG_STATUS.UNSUPPORTED : VOICE_LOG_STATUS.ERROR) }
  }
  const stop = () => { adapterRef.current.stop(); setStatus(VOICE_LOG_STATUS.PROCESSING) }
  const cancel = () => { adapterRef.current.abort(); setPreview(null); setError(null); setStatus(adapterRef.current.supported === false ? VOICE_LOG_STATUS.UNSUPPORTED : VOICE_LOG_STATUS.IDLE); logVoiceLogEvent('voice_log_cancelled') }
  const edit = patch => setPreview(value => ({ ...value, currentSet:{...value.currentSet,...patch}, warnings:[], valid:true }))
  const success = () => { setStatus(VOICE_LOG_STATUS.SUCCESS); logVoiceLogEvent('voice_log_confirmed'); setTimeout(() => setStatus(VOICE_LOG_STATUS.IDLE), 1400) }
  return { status, preview, error, start, stop, cancel, edit, success, processTranscript }
}

