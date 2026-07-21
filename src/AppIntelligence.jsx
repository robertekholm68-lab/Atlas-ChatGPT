import { useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Bot, Brain, CalendarDays,
  Check, ChevronRight, ClipboardList, Dumbbell, Gauge, Goal, HeartPulse,
  History, Home, MessageCircle, Moon, RefreshCw, Save, Settings2, ShieldCheck,
  Sparkles, Target, TrendingUp, UserRound, Zap
} from 'lucide-react'
import {
  COACH_MODES, KNOWLEDGE_BASE, answerCoachQuestion, buildDailyDecision,
  buildGoalPlan, calculateReadiness, defaultProfile
} from './atlasCoachEngine'
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

export default function AppIntelligence() {
  const saved = loadState()
  const [page, setPage] = useState(saved?.page || 'today')
  const [profile, setProfile] = useState(saved?.profile || defaultProfile)
  const [decisions, setDecisions] = useState(saved?.decisions || [])
  const [messages, setMessages] = useState(saved?.messages || [
    { role: 'coach', text: 'God morgon Robert. Jag har analyserat dagsformen och dagens plan.' }
  ])
  const [toast, setToast] = useState('')
  const decision = useMemo(() => buildDailyDecision(profile), [profile])
  const readiness = calculateReadiness(profile)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ page, profile, decisions, messages }))
  }, [page, profile, decisions, messages])

  function notify(text) {
    setToast(text)
    window.setTimeout(() => setToast(''), 2200)
  }

  function acceptDecision() {
    setDecisions(current => [{ ...decision, accepted: true }, ...current])
    notify('Rekommendationen är införd i planen')
  }

  function updateCheckIn(key, value) {
    setProfile(p => ({ ...p, checkIn: { ...p.checkIn, [key]: value } }))
  }

  function updateGoal(key, value) {
    setProfile(p => ({ ...p, goal: { ...p.goal, [key]: value } }))
  }

  return <div className="atlas-i-shell">
    <aside className="atlas-i-sidebar">
      <div className="atlas-i-brand"><span>A</span><div><strong>ATLAS</strong><small>INTELLIGENCE</small></div></div>
      <nav>{nav.map(([id, label, Icon]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <div className="atlas-i-user"><span>RE</span><div><strong>Robert</strong><small>{COACH_MODES[profile.mode].label} coach</small></div></div>
    </aside>

    <main className="atlas-i-main">
      <header className="atlas-i-topbar">
        <div><p>ATLAS Intelligence Engine</p><h1>{pageTitle(page)}</h1></div>
        <div className="engine-status"><span/><strong>Lokal coach aktiv</strong><small>Ingen extern AI ansluten</small></div>
      </header>

      {page === 'today' && <TodayPage profile={profile} decision={decision} readiness={readiness} acceptDecision={acceptDecision} setPage={setPage}/>} 
      {page === 'coach' && <CoachPage profile={profile} messages={messages} setMessages={setMessages} setPage={setPage}/>} 
      {page === 'goal' && <GoalPage profile={profile} updateGoal={updateGoal} notify={notify}/>} 
      {page === 'recovery' && <RecoveryPage profile={profile} updateCheckIn={updateCheckIn} readiness={readiness}/>} 
      {page === 'decisions' && <DecisionPage decisions={decisions} current={decision} acceptDecision={acceptDecision}/>} 
      {page === 'settings' && <SettingsPage profile={profile} setProfile={setProfile} notify={notify}/>} 
    </main>

    <nav className="atlas-i-mobile-nav">{nav.slice(0,5).map(([id,label,Icon]) => <button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}><Icon size={19}/><span>{label}</span></button>)}</nav>
    {toast && <div className="atlas-i-toast">{toast}</div>}
  </div>
}

function TodayPage({ profile, decision, readiness, acceptDecision, setPage }) {
  return <div className="i-grid">
    <section className="i-hero span-8">
      <div><span className="i-pill"><Sparkles size={15}/> Dagens brief</span><h2>God morgon, {profile.name}</h2><p>{decision.message}</p><div className="i-actions"><button className="i-primary" onClick={acceptDecision}><Check size={18}/> Acceptera planen</button><button className="i-secondary" onClick={()=>setPage('coach')}>Fråga coachen <ArrowRight size={17}/></button></div></div>
      <div className="readiness-orb"><strong>{readiness}</strong><span>Readiness</span></div>
    </section>
    <Metric icon={Moon} label="Sömn" value={`${profile.checkIn.sleep} h`} note="Senaste natten"/>
    <Metric icon={Zap} label="Energi" value={`${profile.checkIn.energy}/10`} note="Egen skattning"/>
    <Metric icon={Activity} label="Belastning" value={`${profile.recentLoad}%`} note="Senaste 7 dagarna"/>
    <Metric icon={Goal} label="Målföljsamhet" value={`${profile.adherence}%`} note={`${profile.goal.weeks} veckor kvar`}/>

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
      <SectionTitle icon={CalendarDays} eyebrow="Planen idag" title="Så här anpassar ATLAS passet"/>
      <div className="adaptation-grid">
        <Adaptation title="Pass" value={decision.action === 'recovery' ? 'Återhämtning' : decision.action.includes('upper') ? 'Överkropp' : 'Modifierat pass'} />
        <Adaptation title="Volym" value={decision.volumeChange === 0 ? 'Oförändrad' : `${decision.volumeChange}%`} />
        <Adaptation title="Intensitet" value={readiness >= 70 ? 'Normal' : 'Kontrollerad'} />
        <Adaptation title="Reserv" value={readiness >= 70 ? '2 RIR' : '3 RIR'} />
      </div>
    </section>
  </div>
}

function CoachPage({ profile, messages, setMessages, setPage }) {
  const [text, setText] = useState('')
  const [suggestions, setSuggestions] = useState(['Hur bör jag träna idag?', 'Varför är benen trötta?', 'Hur ligger jag till mot målet?'])
  function send(value=text) {
    if (!value.trim()) return
    const result = answerCoachQuestion(value, profile)
    setMessages(m => [...m, {role:'user', text:value}, {role:'coach', text:result.reply}])
    setSuggestions(result.followUps || [])
    setText('')
  }
  return <div className="coach-page">
    <section className="coach-header"><div className="coach-avatar"><Bot size={36}/></div><div><span>Lokal kunskapsmotor</span><h2>ATLAS Coach</h2><p>Resonerar utifrån dagsform, mål, belastning och träningsprinciper.</p></div></section>
    <section className="chat-window">{messages.map((m,i)=><div key={i} className={`chat-message ${m.role}`}><span>{m.role==='coach'?'ATLAS':'Du'}</span><p>{m.text}</p></div>)}</section>
    <div className="suggestion-row">{suggestions.map(s=><button key={s} onClick={()=>send(s)}>{s}</button>)}</div>
    <div className="coach-input"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Berätta hur du mår eller fråga om träningen…"/><button onClick={()=>send()}><ArrowRight size={20}/></button></div>
    <button className="text-link" onClick={()=>setPage('decisions')}>Visa coachens beslutshistorik</button>
  </div>
}

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

function RecoveryPage({ profile, updateCheckIn, readiness }) {
  return <div className="i-grid">
    <section className="i-panel span-5"><SectionTitle icon={Gauge} eyebrow="Daglig check-in" title="Hur känns kroppen?"/>
      <Slider label="Energi" value={profile.checkIn.energy} onChange={v=>updateCheckIn('energy',v)}/>
      <Slider label="Stress" value={profile.checkIn.stress} onChange={v=>updateCheckIn('stress',v)}/>
      <Slider label="Muskelömhet" value={profile.checkIn.soreness} onChange={v=>updateCheckIn('soreness',v)}/>
      <Slider label="Motivation" value={profile.checkIn.motivation} onChange={v=>updateCheckIn('motivation',v)}/>
      <label className="sleep-field">Sömn<input type="number" step="0.1" value={profile.checkIn.sleep} onChange={e=>updateCheckIn('sleep',Number(e.target.value))}/><span>timmar</span></label>
      <label className="pain-field">Smärta<select value={profile.checkIn.pain} onChange={e=>updateCheckIn('pain',e.target.value)}><option value="none">Ingen</option><option value="mild">Lätt</option><option value="moderate">Tydlig</option></select></label>
    </section>
    <section className="i-panel span-7"><SectionTitle icon={HeartPulse} eyebrow="Recovery Engine" title={`Total readiness ${readiness}`}/>
      <div className="recovery-list">{Object.entries(profile.recovery).filter(([k])=>k!=='total').map(([key,value])=><div key={key}><span>{muscleLabel(key)}</span><div><i style={{width:`${value}%`}}/></div><b>{value}%</b></div>)}</div>
      <div className={`recovery-advice ${readiness<45?'warning':''}`}><ShieldCheck size={24}/><div><strong>{readiness>=70?'Klar för kvalitetsträning':readiness>=45?'Träna med reducerad volym':'Prioritera återhämtning'}</strong><p>{readiness>=70?KNOWLEDGE_BASE.readiness.high:readiness>=45?KNOWLEDGE_BASE.readiness.medium:KNOWLEDGE_BASE.readiness.low}</p></div></div>
    </section>
  </div>
}

function DecisionPage({ decisions, current, acceptDecision }) {
  const all = decisions.length ? decisions : [{...current, accepted:false}]
  return <div className="i-grid">
    <section className="i-panel span-8"><SectionTitle icon={ClipboardList} eyebrow="Decision Engine" title="Beslutshistorik"/>
      <div className="decision-list">{all.map((d,i)=><div key={`${d.id}-${i}`}><span className={d.accepted?'accepted':''}>{d.accepted?<Check size={17}/>:<Brain size={17}/>}</span><div><strong>{d.title}</strong><small>{new Date(d.createdAt).toLocaleString('sv-SE')} · {d.category}</small><p>{d.reason}</p></div></div>)}</div>
    </section>
    <section className="i-panel span-4"><SectionTitle icon={History} eyebrow="Aktuellt beslut" title="Underlag"/><div className="evidence-stack">{current.evidence.map(x=><span key={x}>{x}</span>)}</div><h4>ATLAS slutsats</h4><p>{current.reason}</p><button className="i-primary full" onClick={acceptDecision}><Check size={17}/> Acceptera</button></section>
  </div>
}

function SettingsPage({ profile, setProfile, notify }) {
  return <div className="i-grid">
    <section className="i-panel span-7"><SectionTitle icon={UserRound} eyebrow="Coachpersonlighet" title="Hur ska ATLAS kommunicera?"/>
      <div className="mode-grid">{Object.entries(COACH_MODES).map(([key,mode])=><button key={key} className={profile.mode===key?'active':''} onClick={()=>setProfile(p=>({...p,mode:key}))}><strong>{mode.label}</strong><span>{mode.prefix}</span></button>)}</div>
    </section>
    <section className="i-panel span-5"><SectionTitle icon={Brain} eyebrow="AI-adapter" title="Framtida anslutning"/><div className="adapter-card"><span><Bot size={24}/></span><div><strong>Lokal kunskapsmotor</strong><small>Aktiv nu</small></div><Check size={19}/></div><div className="adapter-card disabled"><span><MessageCircle size={24}/></span><div><strong>Claude / ChatGPT</strong><small>Adapter förberedd, ingen API-nyckel lagras</small></div></div><button className="i-secondary full" onClick={()=>notify('Extern AI kopplas in i en senare fas')}>Visa integrationsplan</button></section>
    <section className="i-panel span-12"><SectionTitle icon={AlertTriangle} eyebrow="Säkerhet" title="Coachens gränser"/><p>ATLAS ger träningsstöd och ersätter inte medicinsk bedömning. Skarp eller ökande smärta, neurologiska symtom, bröstsmärta eller allvarlig sjukdom ska bedömas av vården.</p></section>
  </div>
}

function Metric({icon:Icon,label,value,note}){return <article className="i-metric"><span><Icon size={20}/></span><small>{label}</small><strong>{value}</strong><p>{note}</p></article>}
function SectionTitle({icon:Icon,eyebrow,title}){return <div className="section-title"><span><Icon size={19}/></span><div><small>{eyebrow}</small><h3>{title}</h3></div></div>}
function Adaptation({title,value}){return <div><small>{title}</small><strong>{value}</strong></div>}
function Slider({label,value,onChange}){return <label className="check-slider"><span>{label}<b>{value}/10</b></span><input type="range" min="1" max="10" value={value} onChange={e=>onChange(Number(e.target.value))}/></label>}
function pageTitle(page){return ({today:'Dagens intelligens',coach:'ATLAS Coach',goal:'Goal Intelligence',recovery:'Recovery Engine',decisions:'Decision History',settings:'Coachinställningar'})[page]}
function muscleLabel(key){return ({chest:'Bröst',back:'Rygg',legs:'Ben',shoulders:'Axlar',arms:'Armar',core:'Core'})[key]||key}
