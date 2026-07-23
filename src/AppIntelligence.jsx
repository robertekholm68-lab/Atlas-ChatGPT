import { useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, Bot, Brain, CalendarDays,
  Check, ChevronRight, ClipboardList, Gauge, Goal, HeartPulse,
  History, Home, MessageCircle, Moon, Save, Settings2, ShieldCheck,
  Sparkles, Target, TrendingUp, UserRound, Zap
} from 'lucide-react'
import {
  COACH_MODES, KNOWLEDGE_BASE, answerCoachQuestion, buildDailyDecision,
  buildGoalPlan, calculateReadiness, defaultProfile
} from './atlasCoachEngine'
import { getAtlasState, subscribeAtlas } from './core/atlasStore'
import { AtlasBottomNavigation, AtlasHomeScreen } from './atlasHome'
import { recoverMuscles, recoveryScore } from './core/recoveryEngine'
import { buildCoachRecommendation } from './core/coachIntelligenceEngine'
import { buildRecoveryViewModel } from './recoveryViewModel.js'
import './intelligence.css'

const STORAGE_KEY = 'atlas-intelligence-v1'

const nav = [
  ['today', 'Idag', Home],
  ['coach', 'Coach', Bot],
  ['goal', 'Mål', Target],
  ['recovery', 'Återhämtning', HeartPulse],
  ['decisions', 'Beslut', ClipboardList],
  ['settings', 'Inställningar', Settings2]
]

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function average(values, fallback = 100) {
  const valid = values.filter(value => Number.isFinite(value))
  return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : fallback
}

function coreToProfile(core, localProfile) {
  const recovered = recoverMuscles(core.recovery?.muscles || {}, Date.now())
  const ready = name => recovered[name] ? Math.round(100 - recovered[name].fatigue) : 100
  const workouts = core.workouts || []
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recent = workouts.filter(workout => {
    const value = workout.completedAt || (workout.date ? `${workout.date}T18:00:00` : null)
    return value && new Date(value).getTime() >= sevenDaysAgo
  })
  const recentSets = recent.reduce((sum, workout) => sum + Number(workout.sets || 0), 0)
  const latestWorkout = workouts[0] || null

  const chest = ready('Bröst')
  const back = ready('Rygg')
  const legs = average([ready('Framsida lår'), ready('Baksida lår'), ready('Säte'), ready('Vader')])
  const shoulders = ready('Axlar')
  const arms = average([ready('Biceps'), ready('Triceps'), ready('Underarmar')])
  const coreReady = ready('Bål')
  const total = recoveryScore(core.recovery?.muscles || {}, Date.now())

  return {
    ...localProfile,
    recovery: { total, chest, back, legs, shoulders, arms, core: coreReady },
    recentLoad: Math.min(100, Math.round((recentSets / 60) * 100)),
    coreSummary: {
      workoutCount: workouts.length,
      recentWorkoutCount: recent.length,
      recentSets,
      latestWorkout: latestWorkout ? {
        name: latestWorkout.name,
        completedAt: latestWorkout.completedAt || latestWorkout.date,
        sets: latestWorkout.sets,
        volume: latestWorkout.volume,
        duration: latestWorkout.duration
      } : null
    }
  }
}

export default function AppIntelligence() {
  const saved = loadState()
  const [page, setPage] = useState(saved?.page || 'today')
  const [localProfile, setLocalProfile] = useState(saved?.profile || defaultProfile)
  const [core, setCore] = useState(getAtlasState)
  const [decisions, setDecisions] = useState(saved?.decisions || [])
  const [messages, setMessages] = useState(saved?.messages || [
    { role: 'coach', text: 'God morgon Robert. Jag har analyserat dagsformen och din sparade träningshistorik.' }
  ])
  const [toast, setToast] = useState('')
  const profile = useMemo(() => coreToProfile(core, localProfile), [core, localProfile])
  const decision = useMemo(() => buildDailyDecision(profile), [profile])
  const readiness = calculateReadiness(profile)
  const coachRecommendation = useMemo(() => core.coach?.recommendation || buildCoachRecommendation(core), [core])

  useEffect(() => subscribeAtlas(setCore), [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ page, profile: localProfile, decisions, messages }))
  }, [page, localProfile, decisions, messages])

  function notify(text) {
    setToast(text)
    window.setTimeout(() => setToast(''), 2200)
  }

  function acceptDecision() {
    setDecisions(current => [{ ...decision, accepted: true }, ...current])
    notify('Rekommendationen är införd i planen')
  }

  function updateCheckIn(key, value) {
    setLocalProfile(p => ({ ...p, checkIn: { ...p.checkIn, [key]: value } }))
  }

  function updateGoal(key, value) {
    setLocalProfile(p => ({ ...p, goal: { ...p.goal, [key]: value } }))
  }

  return <div className="atlas-i-shell">
    <aside className="atlas-i-sidebar">
      <div className="atlas-i-brand"><span><img className="brand-logo" src="/assets/program-covers/upper-a.svg" alt="ASKR logo" /></span><div><strong>ASKR</strong><small>INTELLIGENCE</small></div></div>
      <nav>{nav.map(([id, label, Icon]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <div className="atlas-i-user"><span>RE</span><div><strong>{profile.name}</strong><small>{COACH_MODES[profile.mode].label} coach</small></div></div>
    </aside>

    <main className="atlas-i-main">
      <header className="atlas-i-topbar">
        <div><p>ASKR Intelligence Engine</p><h1>{pageTitle(page)}</h1></div>
        <div className="engine-status"><span/><strong>Lokal coach aktiv</strong><small>{profile.coreSummary.workoutCount} pass i ASKR Core</small></div>
      </header>

      {page === 'today' && <AtlasHomeScreen profile={profile} core={core} recommendation={coachRecommendation} readiness={readiness} setPage={setPage}/>} 
      {page === 'coach' && <CoachPage profile={profile} recommendation={coachRecommendation} messages={messages} setMessages={setMessages} setPage={setPage}/>} 
      {page === 'goal' && <GoalPage profile={profile} updateGoal={updateGoal} notify={notify}/>} 
      {page === 'recovery' && <RecoveryPage profile={profile} core={core} updateCheckIn={updateCheckIn} readiness={readiness}/>} 
      {page === 'decisions' && <DecisionPage decisions={decisions} current={decision} acceptDecision={acceptDecision}/>} 
      {page === 'settings' && <SettingsPage profile={profile} setProfile={setLocalProfile} notify={notify}/>} 
    </main>

    <AtlasBottomNavigation page={page} setPage={setPage}/>
    {toast && <div className="atlas-i-toast">{toast}</div>}
  </div>
}

function TodayPage({ profile, decision, readiness, acceptDecision, setPage }) {
  const latest = profile.coreSummary.latestWorkout
  return <div className="i-grid">
    <section className="i-hero span-8">
      <div><span className="i-pill"><Sparkles size={15}/> Dagens brief</span><h2>God morgon, {profile.name}</h2><p>{decision.message}</p><div className="i-actions"><button className="i-primary" onClick={acceptDecision}><Check size={18}/> Acceptera planen</button><button className="i-secondary" onClick={()=>setPage('coach')}>Fråga coachen <ArrowRight size={17}/></button></div></div>
      <div className="readiness-orb"><strong>{readiness}</strong><span>Readiness</span></div>
    </section>
    <Metric icon={Moon} label="Sömn" value={`${profile.checkIn.sleep} h`} note="Senaste natten"/>
    <Metric icon={Zap} label="Energi" value={`${profile.checkIn.energy}/10`} note="Egen skattning"/>
    <Metric icon={Activity} label="Belastning" value={`${profile.recentLoad}%`} note={`${profile.coreSummary.recentSets} set senaste 7 dagarna`}/>
    <Metric icon={Goal} label="Senaste pass" value={latest?.name || 'Inget ännu'} note={latest ? `${latest.sets || 0} set · ${latest.duration || 0} min` : 'Logga ett pass i Träning'}/>

    <section className="i-panel span-7">
      <SectionTitle icon={Brain} eyebrow="Beslut" title={decision.title}/>
      <p className="decision-reason">{decision.reason}</p>
      <div className="evidence-row">{decision.evidence.map(item=><span key={item}>{item}</span>)}</div>
      <button className="why-button" onClick={()=>setPage('decisions')}>Varför rekommenderar du detta? <ChevronRight size={16}/></button>
    </section>

    <section className="i-panel span-5">
      <SectionTitle icon={Target} eyebrow="Aktivt mål" title={profile.goal.title}/>
      <strong className="goal-target">{profile.goal.target}</strong>
      <div className="goal-bar"><span style={{width:`${profile.goal.progress}%`}}/></div>
      <div className="goal-meta"><span>{profile.goal.progress}% klart</span><span>{profile.goal.weeks} veckor kvar</span></div>
    </section>

    <section className="i-panel span-12">
      <SectionTitle icon={CalendarDays} eyebrow="Planen idag" title="Så här anpassar ASKR passet"/>
      <div className="adaptation-grid">
        <Adaptation title="Pass" value={decision.action === 'recovery' ? 'Återhämtning' : decision.action.includes('upper') ? 'Överkropp' : 'Modifierat pass'} />
        <Adaptation title="Volym" value={decision.volumeChange === 0 ? 'Oförändrad' : `${decision.volumeChange}%`} />
        <Adaptation title="Intensitet" value={readiness >= 70 ? 'Normal' : 'Kontrollerad'} />
        <Adaptation title="Reserv" value={readiness >= 70 ? '2 RIR' : '3 RIR'} />
      </div>
    </section>
  </div>
}

function CoachPage({ profile, recommendation, messages, setMessages, setPage }) {
  const [text, setText] = useState('')
  const prompts = buildCoachPrompts(recommendation)
  function send(value=text) {
    if (!value.trim()) return
    const result = answerCoachQuestion(`${value}\n\nCoach recommendation context: ${JSON.stringify(recommendation)}`, profile)
    setMessages(m => [...m, {role:'user', text:value}, {role:'coach', text:result.reply}])
    setText('')
  }
  const ctx = recommendation.context || {}
  return <div className="coach-page proactive-coach">
    <section className="coach-context-card">
      <div><span>God morgon, {ctx.firstName || profile.name}</span><h2>{recommendation.insufficientData ? 'ASKR behöver mer underlag' : 'Dagens rådgivning är klar'}</h2><p>{recommendation.insufficientData ? 'Logga dagsform och pass för mer personlig precision.' : `Energi ${profile.checkIn.energy}/10 · Sömn ${profile.checkIn.sleep} h · Motivation ${profile.checkIn.motivation}/10 · Stress ${profile.checkIn.stress}/10 · Återhämtning ${ctx.recoveryScore ?? profile.recovery.total}%`}</p></div>
      <div className="coach-confidence"><strong>{Math.round((recommendation.confidence || 0) * 100)}%</strong><span>{recommendation.confidenceLabel} säkerhet</span></div>
    </section>

    <section className={`i-hero coach-decision-card ${recommendation.insufficientData ? 'insufficient' : ''}`}>
      <div><span className="i-pill"><Sparkles size={15}/> DAGENS BESLUT</span><h2>{recommendation.headline}</h2><p>{recommendation.summary}</p><small>{Math.round((recommendation.confidence || 0) * 100)} % confidence att detta är det mest lämpliga valet utifrån tillgänglig data.</small><div className="i-actions"><button className="i-primary" onClick={()=>setPage(recommendation.primaryActionTarget || 'today')}><Zap size={18}/> {recommendation.primaryActionLabel}</button>{recommendation.alternatives?.[0] && <button className="i-secondary" onClick={()=>setPage(recommendation.alternatives[0].target)}>{recommendation.alternatives[0].label}<ArrowRight size={17}/></button>}</div></div>
    </section>

    {!recommendation.insufficientData && <section className="i-panel"><SectionTitle icon={Brain} eyebrow="Primär rekommendation" title={recommendation.decision?.title || recommendation.headline}/><p className="decision-reason">{recommendation.summary}</p></section>}

    {!!recommendation.reasons?.length && <section className="i-panel"><SectionTitle icon={ClipboardList} eyebrow="Varför denna rekommendation" title="Spårbart underlag"/><div className="coach-reason-list">{recommendation.reasons.map(item => <div key={item.text}><Check size={16}/><span>{item.text}</span><small>{item.source}</small></div>)}</div></section>}

    {recommendation.expectedImpact && <section className="i-panel"><SectionTitle icon={TrendingUp} eyebrow="Förväntad påverkan" title="Försiktig prognos"/><p className="decision-reason">{recommendation.expectedImpact}</p></section>}

    <section className="coach-support-grid">
      <SupportCard label="Veckan" value={`${ctx.weeklyCompletion ?? 0} pass`} note="Senaste 7 dagarna"/>
      <SupportCard label="Senaste pass" value={ctx.latestWorkout?.name || 'Saknas'} note={ctx.latestWorkout ? 'Från ASKR Core' : 'Logga ett pass'}/>
      <SupportCard label="Mål" value={ctx.activeGoal || 'Ej valt'} note="Aktiv målbild"/>
      <SupportCard label="Datakvalitet" value={recommendation.dataQuality?.label || 'okänd'} note={`${recommendation.dataQuality?.signals || 0}/${recommendation.dataQuality?.possibleSignals || 0} signaler`}/>
    </section>

    <section className="i-panel coach-followup"><SectionTitle icon={MessageCircle} eyebrow="Chat för följdfrågor" title="Fråga om beslutet"/>
      <div className="suggestion-row">{prompts.map(s=><button key={s} onClick={()=>send(s)}>{s}</button>)}</div>
      <section className="chat-window compact">{messages.map((m,i)=><div key={i} className={`chat-message ${m.role}`}><span>{m.role==='coach'?'ASKR':'Du'}</span><p>{m.text}</p></div>)}</section>
      <div className="coach-input"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ställ en följdfråga om dagens rekommendation…"/><button onClick={()=>send()}><ArrowRight size={20}/></button></div>
    </section>
  </div>
}

function buildCoachPrompts(recommendation) {
  if (recommendation.insufficientData) return ['Vad behöver jag logga?', 'Visa programmet', 'Hur fungerar rekommendationen?']
  return ['Varför rekommenderar du detta?', 'Vad händer om jag vilar idag?', 'Kan du göra passet lättare?', 'Hur ligger jag till mot mitt mål?']
}

function SupportCard({ label, value, note }) { return <article className="i-panel coach-support-card"><span>{label}</span><strong>{value}</strong><small>{note}</small></article> }


function GoalPage({ profile, updateGoal, notify }) {
  const plan = buildGoalPlan(profile.goal)
  return <div className="i-grid">
    <section className="i-panel span-5 goal-editor"><SectionTitle icon={Target} eyebrow="Goal Intelligence" title="Definiera målet"/>
      <label>Målnamn<input value={profile.goal.title} onChange={e=>updateGoal('title',e.target.value)}/></label>
      <label>Vad vill du uppnå?<textarea value={profile.goal.target} onChange={e=>updateGoal('target',e.target.value)}/></label>
      <label>Veckor kvar<input type="number" min="1" value={profile.goal.weeks} onChange={e=>updateGoal('weeks',Number(e.target.value))}/></label>
      <button className="i-primary" onClick={()=>notify('Målplanen är uppdaterad')}><Save size={17}/> Spara mål</button>
    </section>
    <section className="i-panel span-7"><SectionTitle icon={TrendingUp} eyebrow="Automatisk färdplan" title={`${plan.weeks} veckor till målet`}/>
      <div className="phase-list">{plan.phases.map((phase,i)=><div key={phase.name}><span>{i+1}</span><div><strong>{phase.name}</strong><p>{phase.focus}</p></div><b>{phase.weeks} v</b></div>)}</div>
      <h4>Veckomål</h4><div className="weekly-targets">{plan.weeklyTargets.map(x=><span key={x}><Check size={15}/>{x}</span>)}</div>
    </section>
  </div>
}

function RecoveryPage({ profile, core, updateCheckIn, readiness }) {
  const recovery = buildRecoveryViewModel({ profile, core, readiness })
  const painLabel = { none: 'Ingen smärta', mild: 'Lätt smärta', moderate: 'Tydlig smärta' }[recovery.pain] || 'Ej loggat'

  return <div className="i-grid recovery-dashboard">
    <section className={`i-hero span-12 recovery-hero ${recovery.tone}`}>
      <div><span className="i-pill"><HeartPulse size={15}/> Recovery Engine</span><h2>{recovery.headline}</h2><p>{recovery.advice}</p><div className="recovery-hero-meta"><span>{recovery.sleep.label}</span><span>{recovery.stress.label}</span><span>{painLabel}</span></div></div>
      <div className="readiness-orb recovery-score-orb" style={{'--recovery-score': `${recovery.score}%`}}><strong>{recovery.score}</strong><span>Readiness</span></div>
    </section>

    <section className="i-panel span-5 recovery-checkin-panel"><SectionTitle icon={Gauge} eyebrow="Daglig check-in" title="Hur känns kroppen?"/>
      <Slider label="Energi" value={profile.checkIn.energy} onChange={v=>updateCheckIn('energy',v)}/>
      <Slider label="Stress" value={profile.checkIn.stress} onChange={v=>updateCheckIn('stress',v)}/>
      <Slider label="Muskelömhet" value={profile.checkIn.soreness} onChange={v=>updateCheckIn('soreness',v)}/>
      <Slider label="Motivation" value={profile.checkIn.motivation} onChange={v=>updateCheckIn('motivation',v)}/>
      <label className="sleep-field">Sömn<input type="number" step="0.1" value={profile.checkIn.sleep} onChange={e=>updateCheckIn('sleep',Number(e.target.value))}/><span>timmar</span></label>
      <label className="pain-field">Smärta<select value={profile.checkIn.pain} onChange={e=>updateCheckIn('pain',e.target.value)}><option value="none">Ingen</option><option value="mild">Lätt</option><option value="moderate">Tydlig</option></select></label>
    </section>

    <section className="i-panel span-7 recovery-summary-panel"><SectionTitle icon={ShieldCheck} eyebrow="Beslutsstöd" title="Dagens återhämtningsplan"/>
      <div className="recovery-plan-grid">
        <RecoverySignal label="Sömn" value={recovery.sleep.value ? `${recovery.sleep.value} h` : '—'} note={recovery.sleep.label}/>
        <RecoverySignal label="Energi" value={`${recovery.energy.value}/10`} note={recovery.energy.label}/>
        <RecoverySignal label="Stress" value={`${recovery.stress.value}/10`} note={recovery.stress.label}/>
        <RecoverySignal label="Ömhet" value={`${recovery.soreness.value}/10`} note={recovery.soreness.label}/>
      </div>
      <div className={`recovery-advice ${recovery.score<50?'warning':''}`}><ShieldCheck size={24}/><div><strong>{recovery.score>=75?'Klar för kvalitetsträning':recovery.score>=50?'Träna med reducerad volym':'Prioritera återhämtning'}</strong><p>{recovery.score>=75?KNOWLEDGE_BASE.readiness.high:recovery.score>=50?KNOWLEDGE_BASE.readiness.medium:KNOWLEDGE_BASE.readiness.low}</p></div></div>
    </section>

    <section className="i-panel span-7"><SectionTitle icon={HeartPulse} eyebrow="Muskelåterhämtning" title="Live från ASKR Core"/>
      {recovery.hasCoreRecovery ? <div className="recovery-muscle-grid">{recovery.muscles.map(muscle=><article key={muscle.name} className={muscle.readiness<50?'loaded':''}><div><strong>{muscle.name}</strong><small>{muscle.fatigue}% belastning</small></div><b>{muscle.readiness}%</b><div><i style={{width:`${muscle.readiness}%`}}/></div></article>)}</div> : <p className="atlas-empty">Ingen lokal muskelåterhämtning loggad ännu. Avsluta ett pass för att fylla kroppskartan.</p>}
    </section>

    <section className="i-panel span-5"><SectionTitle icon={Activity} eyebrow="Belastningsfokus" title="Vad ska skyddas?"/>
      <div className="recovery-focus-list">
        <RecoveryFocus label="Mest belastad" value={recovery.mostLoaded?.name || 'Saknas'} note={recovery.mostLoaded ? `${recovery.mostLoaded.readiness}% redo` : 'Ingen muskeldata ännu'}/>
        <RecoveryFocus label="Mest redo" value={recovery.freshest?.name || 'Saknas'} note={recovery.freshest ? `${recovery.freshest.readiness}% redo` : 'Logga pass för bättre förslag'}/>
        <RecoveryFocus label="Senaste pass" value={recovery.recentWorkouts[0]?.name || 'Inget ännu'} note={recovery.recentWorkouts[0] ? `${recovery.recentWorkouts[0].sets} set sparade` : 'Starta i Träning'} />
      </div>
    </section>
  </div>
}

function RecoverySignal({ label, value, note }) { return <article><span>{label}</span><strong>{value}</strong><small>{note}</small></article> }
function RecoveryFocus({ label, value, note }) { return <div><span>{label}</span><strong>{value}</strong><small>{note}</small></div> }

function DecisionPage({ decisions, current, acceptDecision }) {
  const all = decisions.length ? decisions : [{...current, accepted:false}]
  return <div className="i-grid">
    <section className="i-panel span-8"><SectionTitle icon={ClipboardList} eyebrow="Decision Engine" title="Beslutshistorik"/>
      <div className="decision-list">{all.map((d,i)=><div key={`${d.id}-${i}`}><span className={d.accepted?'accepted':''}>{d.accepted?<Check size={17}/>:<Brain size={17}/>}</span><div><strong>{d.title}</strong><small>{new Date(d.createdAt).toLocaleString('sv-SE')} · {d.category}</small><p>{d.reason}</p></div></div>)}</div>
    </section>
    <section className="i-panel span-4"><SectionTitle icon={History} eyebrow="Aktuellt beslut" title="Underlag"/><div className="evidence-stack">{current.evidence.map(x=><span key={x}>{x}</span>)}</div><h4>ASKR slutsats</h4><p>{current.reason}</p><button className="i-primary full" onClick={acceptDecision}><Check size={17}/> Acceptera</button></section>
  </div>
}

function SettingsPage({ profile, setProfile, notify }) {
  return <div className="i-grid">
    <section className="i-panel span-7"><SectionTitle icon={UserRound} eyebrow="Coachpersonlighet" title="Hur ska ASKR kommunicera?"/>
      <div className="mode-grid">{Object.entries(COACH_MODES).map(([key,mode])=><button key={key} className={profile.mode===key?'active':''} onClick={()=>setProfile(p=>({...p,mode:key}))}><strong>{mode.label}</strong><span>{mode.prefix}</span></button>)}</div>
    </section>
    <section className="i-panel span-5"><SectionTitle icon={Brain} eyebrow="AI-adapter" title="Framtida anslutning"/><div className="adapter-card"><span><Bot size={24}/></span><div><strong>Lokal kunskapsmotor</strong><small>Aktiv nu · ASKR Core ansluten</small></div><Check size={19}/></div><div className="adapter-card disabled"><span><MessageCircle size={24}/></span><div><strong>Claude / ChatGPT</strong><small>Adapter förberedd, ingen API-nyckel lagras</small></div></div><button className="i-secondary full" onClick={()=>notify('Extern AI kopplas in i en senare fas')}>Visa integrationsplan</button></section>
    <section className="i-panel span-12"><SectionTitle icon={AlertTriangle} eyebrow="Säkerhet" title="Coachens gränser"/><p>ASKR ger träningsstöd och ersätter inte medicinsk bedömning. Skarp eller ökande smärta, neurologiska symtom, bröstsmärta eller allvarlig sjukdom ska bedömas av vården.</p></section>
  </div>
}

function Metric({icon:Icon,label,value,note}){return <article className="i-metric"><span><Icon size={20}/></span><small>{label}</small><strong>{value}</strong><p>{note}</p></article>}
function SectionTitle({icon:Icon,eyebrow,title}){return <div className="section-title"><span><Icon size={19}/></span><div><small>{eyebrow}</small><h3>{title}</h3></div></div>}
function Adaptation({title,value}){return <div><small>{title}</small><strong>{value}</strong></div>}
function Slider({label,value,onChange}){return <label className="check-slider"><span>{label}<b>{value}/10</b></span><input type="range" min="1" max="10" value={value} onChange={e=>onChange(Number(e.target.value))}/></label>}
function pageTitle(page){return ({today:'Dagens intelligens',coach:'ASKR Coach',goal:'Goal Intelligence',recovery:'Recovery Engine',decisions:'Decision History',settings:'Coachinställningar'})[page]}
function muscleLabel(key){return ({chest:'Bröst',back:'Rygg',legs:'Ben',shoulders:'Axlar',arms:'Armar',core:'Core'})[key]||key}
