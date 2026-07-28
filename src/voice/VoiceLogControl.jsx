import { Check, Mic, Pencil, Square, X } from 'lucide-react'
import { useState } from 'react'
import { applyVoiceLogCommand } from './applyVoiceLogCommand.js'
import { VOICE_LOG_STATUS } from './speechRecognitionAdapter.js'
import { useVoiceLog } from './useVoiceLog.js'
import { validateVoiceLogCommand } from './validateVoiceLogCommand.js'

const messageFor = error => error?.code === 'permission_denied'
  ? 'Mikrofonbehörighet nekades. Tillåt mikrofonen i enhetens inställningar och försök igen.'
  : error?.code === 'no_transcript' ? 'Ingen transkription hördes. Försök igen.' : 'Röstloggningen kunde inte startas.'

export default function VoiceLogControl({ session, setSession, exerciseIndex, setIndex, context, autoRest, notify }) {
  const voice = useVoiceLog(context)
  const [editing, setEditing] = useState(false)
  const [developmentText, setDevelopmentText] = useState('')
  const preview = voice.preview
  const unsupported = voice.status === VOICE_LOG_STATUS.UNSUPPORTED
  const busy = [VOICE_LOG_STATUS.REQUESTING_PERMISSION, VOICE_LOG_STATUS.LISTENING, VOICE_LOG_STATUS.PROCESSING].includes(voice.status)
  const confirm = () => {
    const checked = validateVoiceLogCommand(preview, context)
    if (!checked.valid) return
    setSession(current => applyVoiceLogCommand(current, exerciseIndex, setIndex, checked, Date.now(), autoRest))
    voice.success(); setEditing(false); notify?.('Set loggat')
  }
  const format = value => value == null ? '—' : String(value).replace('.', ',')

  return <section className="voice-log" aria-label="ASKR Voice Log">
    {unsupported ? <p className="voice-log-message">Röstloggning stöds inte på den här enheten ännu.</p> : <button type="button" className={`voice-log-trigger ${voice.status === VOICE_LOG_STATUS.LISTENING ? 'listening' : ''}`} onClick={voice.status === VOICE_LOG_STATUS.LISTENING ? voice.stop : voice.start} disabled={voice.status === VOICE_LOG_STATUS.PROCESSING || voice.status === VOICE_LOG_STATUS.REQUESTING_PERMISSION}>
      {voice.status === VOICE_LOG_STATUS.LISTENING ? <Square size={20}/> : <Mic size={22}/>}<span>{voice.status === VOICE_LOG_STATUS.LISTENING ? 'Lyssnar…' : voice.status === VOICE_LOG_STATUS.PROCESSING || voice.status === VOICE_LOG_STATUS.REQUESTING_PERMISSION ? 'Tolkar…' : 'Logga med rösten'}</span>
    </button>}
    {busy && <button type="button" className="voice-log-cancel" onClick={voice.cancel}>Avbryt</button>}
    {voice.status === VOICE_LOG_STATUS.ERROR && <div className="voice-log-error" role="alert"><p>{messageFor(voice.error)}</p><button type="button" onClick={voice.cancel}>Stäng</button></div>}
    {preview && voice.status === VOICE_LOG_STATUS.PREVIEW && <div className="voice-log-preview" role="dialog" aria-label="Bekräfta röstloggning">
      <strong>{format(preview.currentSet.weightKg)} kg · {format(preview.currentSet.reps)} reps · RPE {format(preview.currentSet.rpe)}</strong>
      {!preview.valid && <p role="alert">Jag kunde inte tolka det. Prova till exempel: 75 kilo, 8 reps.</p>}
      {editing && <div className="voice-log-fields">
        <label>Vikt<input type="number" inputMode="decimal" value={preview.currentSet.weightKg ?? ''} onChange={event=>voice.edit({weightKg:event.target.value === '' ? null : Number(event.target.value)})}/></label>
        <label>Reps<input type="number" inputMode="numeric" value={preview.currentSet.reps ?? ''} onChange={event=>voice.edit({reps:event.target.value === '' ? null : Number(event.target.value)})}/></label>
        <label>RPE<input type="number" inputMode="decimal" min="1" max="10" value={preview.currentSet.rpe ?? ''} onChange={event=>voice.edit({rpe:event.target.value === '' ? null : Number(event.target.value)})}/></label>
        <label className="voice-log-completed"><input type="checkbox" checked={preview.currentSet.completed} onChange={event=>voice.edit({completed:event.target.checked})}/>Markera klart</label>
      </div>}
      <div className="voice-log-actions"><button type="button" className="confirm" disabled={!preview.valid} onClick={confirm}><Check size={17}/>Bekräfta</button><button type="button" onClick={()=>setEditing(value=>!value)}><Pencil size={16}/>Ändra</button><button type="button" onClick={()=>{voice.cancel();setEditing(false)}}><X size={17}/>Avbryt</button></div>
    </div>}
    {voice.status === VOICE_LOG_STATUS.SUCCESS && <p className="voice-log-success" role="status">Set loggat</p>}
    {import.meta.env.DEV && import.meta.env.VITE_VOICE_LOG_TEXT_FALLBACK === 'true' && <form className="voice-log-dev" onSubmit={event=>{event.preventDefault();voice.processTranscript(developmentText)}}><label>Voice Log testtext<input value={developmentText} onChange={event=>setDevelopmentText(event.target.value)}/></label><button type="submit">Tolka</button></form>}
  </section>
}

