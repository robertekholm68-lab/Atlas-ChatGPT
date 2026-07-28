const ALLOWED_EVENTS = new Set(['voice_log_started','voice_log_transcribed','voice_log_parse_success','voice_log_parse_failed','voice_log_confirmed','voice_log_cancelled'])
export function logVoiceLogEvent(event) {
  if (ALLOWED_EVENTS.has(event) && typeof console !== 'undefined') console.info(`[ASKR] ${event}`)
}

