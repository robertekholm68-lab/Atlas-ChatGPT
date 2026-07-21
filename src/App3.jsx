import { useEffect, useMemo, useState } from 'react'
import {
  Activity, Apple, ArrowRight, BarChart3, Bell, Bot, Check, ChevronDown,
  ChevronRight, CirclePause, CirclePlay, Dumbbell, Flame, Home, Minus,
  Plus, RotateCcw, Search, Settings, Sparkles, Target, TimerReset,
  TrendingUp, Trophy, Utensils, X, Zap
} from 'lucide-react'
import './phase2.css'
import './phase3.css'

const navItems = [
  { id:'today', label:'Idag', icon:Home },
  { id:'train', label:'Träning', icon:Dumbbell },
  { id:'body', label:'Kropp', icon:Activity },
  { id:'nutrition', label:'Kost', icon:Utensils },
  { id:'coach', label:'Coach', icon:Bot }
]

const pageMeta = {
  today:['God morgon, Robert','Din kropp är redo för ett kvalitativt pass.'],
  train:['Träning','Program, aktivt pass, progression och historik.'],
  body:['Kroppsstatus','Belastning och återhämtning i ett sammanhang.'],
  nutrition:['Kost','Energi, protein och vanor.'],
  coach:['ATLAS Coach','Personliga råd grundade i din träningsdata.']
}

const programs = [
  {
    id:'upper-a', name:'Överkropp A', focus:'Styrka', duration:58,
    exercises:[
      { id:'bench', name:'Bänkpress', muscle:'Bröst · Triceps', target:'4 × 6', rest:120, last:'72,5 kg × 6', sets:[{kg:72.5,reps:6,rpe:8},{kg:72.5,reps:6,rpe:8},{kg:72.5,reps:5,rpe:9},{kg:70,reps:6,rpe:8}] },
      { id:'row', name:'Sittande rodd', muscle:'Rygg · Biceps', target:'4 × 8', rest:90, last:'65 kg × 8', sets:[{kg:65,reps:8,rpe:8},{kg:65,reps:8,rpe:8},{kg:65,reps:8,rpe:8},{kg:65,reps:7,rpe:9}] },
      { id:'press', name:'Axelpress', muscle:'Axlar · Triceps', target:'3 × 8', rest:90, last:'24 kg × 8', sets:[{kg:24,reps:8,rpe:8},{kg:24,reps:8,rpe:8},{kg:24,reps:7,rpe:9}] },
      { id:'pulldown', name:'Latsdrag', muscle:'Rygg · Biceps', target:'3 × 10', rest:75, last:'60 kg × 10', sets:[{kg:60,reps:10,rpe:8},{kg:60,reps:10,rpe:8},{kg:60,reps:9,rpe:9}] }
    ]
  },
  {
    id:'lower-a', name:'Underkropp A', focus:'Kontrollerad styrka', duration:62,
    exercises:[
      { id:'squat', name:'Knäböj', muscle:'Framsida lår · Säte', target:'4 × 6', rest:150, last:'90 kg × 6', sets:[{kg:90,reps:6,rpe:8},{kg:90,reps:6,rpe:8},{kg:87.5,reps:6,rpe:8},{kg:87.5,reps:6,rpe:8}] },
      { id:'rdl', name:'Raka marklyft', muscle:'Baksida lår · Säte', target:'3 × 8', rest:120, last:'80 kg × 8', sets:[{kg:80,reps:8,rpe:8},{kg:80,reps:8,rpe:8},{kg:80,reps:8,rpe:9}] },
      { id:'legpress', name:'Benpress', muscle:'Framsida lår', target:'3 × 10', rest:90, last:'170 kg × 10', sets:[{kg:170,reps:10,rpe:8},{kg:170,reps:10,rpe:8},{kg:170,reps:10,rpe:9}] }
    ]
  }
]

const historySeed = [
  { id:1, date:'18 juli', name:'Överkropp A', duration:56, volume:7820, sets:14, rating:4 },
  { id:2, date:'15 juli', name:'Underkropp A', duration:63, volume:11240, sets:13, rating:4 },
  { id:3, date:'12 juli', name:'Överkropp A', duration:54, volume:7510, sets:14, rating:5 }
]

function loadSaved(){
  try { return JSON.parse(localStorage.getItem('atlas-phase3') || 'null') } catch { return null }
}

function App3(){
  const saved = loadSaved()
  const [activePage,setActivePage] = useState(saved?.activePage || 'today')
  const [menuOpen,setMenuOpen] = useState(false)
  const [toast,setToast] = useState('')
  const [history,setHistory] = useState(saved?.history || historySeed)
  const [workout,setWorkout] = useState(saved?.workout || null)
  const [title,subtitle] = pageMeta[activePage]

  useEffect(()=>{
    localStorage.setItem('atlas-phase3', JSON.stringify({activePage,history,workout}))
  },[activePage,history,workout])

  function notify(message){ setToast(message); window.setTimeout(()=>setToast(''),2200) }
  function startWorkout(program=programs[0]){
    const exercises = program.exercises.map(ex=>({
      ...ex,
      sets: ex.sets.map((s,i)=>({ ...s, id:`${ex.id}-${i}`, done:false }))
    }))
    setWorkout({ id:Date.now(), programId:program.id, name:program.name, startedAt:Date.now(), elapsed:0, paused:false, activeExercise:0, exercises })
    setActivePage('train')
    notify('Passet är startat')
  }
  function finishWorkout(summary){
    setHistory([{ id:Date.now(), date:'21 juli', ...summary }, ...history])
    setWorkout(null)
    notify('Passet sparades i historiken')
  }

  return <div className="app-shell">
    <aside className="sidebar" aria-label="Huvudnavigation">
      <Brand/>
      <nav className="desktop-nav">{navItems.map(item=><NavButton key={item.id} item={item} active={activePage===item.id} onClick={()=>setActivePage(item.id)}/>)}</nav>
      <div className="sidebar-footer"><button className="profile-card" onClick={()=>setMenuOpen(!menuOpen)}><span className="avatar">RE</span><span><strong>Robert</strong><small>ATLAS Member</small></span><Settings size={17}/></button></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><p className="eyebrow">Tisdag · 21 juli</p><h1>{title}</h1><p>{subtitle}</p></div><div className="topbar-actions"><button className="icon-button" aria-label="Sök"><Search size={19}/></button><button className="icon-button notification" aria-label="Notiser"><Bell size={19}/><span/></button></div></header>
      <section className="page-stage">
        {activePage==='today'&&<TodayPage startWorkout={startWorkout} navigate={setActivePage}/>} 
        {activePage==='train'&&<TrainingEngine workout={workout} setWorkout={setWorkout} startWorkout={startWorkout} finishWorkout={finishWorkout} history={history} notify={notify}/>} 
        {activePage==='body'&&<BodyPage/>}
        {activePage==='nutrition'&&<NutritionPage notify={notify}/>} 
        {activePage==='coach'&&<CoachPage notify={notify}/>} 
      </section>
    </main>
    <nav className="mobile-nav" aria-label="Mobilnavigation">{navItems.map(item=><NavButton key={item.id} item={item} active={activePage===item.id} onClick={()=>setActivePage(item.id)} compact/>)}</nav>
    {menuOpen&&<div className="profile-popover"><strong>Robert Ekholm</strong><span>Fas 3 sparar träningspass lokalt i webbläsaren.</span></div>}
    {toast&&<div className="toast">{toast}</div>}
  </div>
}

function TrainingEngine({workout,setWorkout,startWorkout,finishWorkout,history,notify}){
  const [tab,setTab] = useState(workout ? 'active' : 'plan')
  useEffect(()=>{ if(workout) setTab('active') },[workout])
  return <div className="training-engine">
    <div className="training-tabs">
      {[['plan','Program'],['active','Aktivt pass'],['history','Historik'],['progress','Progression']].map(([id,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{label}{id==='active'&&workout&&<i/>}</button>)}
    </div>
    {tab==='plan'&&<ProgramView startWorkout={startWorkout} notify={notify}/>} 
    {tab==='active'&&(workout?<ActiveWorkout workout={workout} setWorkout={setWorkout} finishWorkout={finishWorkout} notify={notify}/>:<EmptyWorkout onStart={()=>startWorkout(programs[0])}/>)}
    {tab==='history'&&<HistoryView history={history}/>} 
    {tab==='progress'&&<ProgressView history={history}/>} 
  </div>
}

function ProgramView({startWorkout,notify}){
  const [selected,setSelected] = useState(programs[0].id)
  const program = programs.find(p=>p.id===selected)
  return <div className="phase3-grid">
    <section className="panel program-picker span-4"><SectionHeading eyebrow="Mina program" title="Veckoupplägg"/><div className="program-list">{programs.map(p=><button key={p.id} className={selected===p.id?'selected':''} onClick={()=>setSelected(p.id)}><span><strong>{p.name}</strong><small>{p.focus} · {p.duration} min</small></span><ChevronRight size={18}/></button>)}</div><button className="secondary-button full" onClick={()=>notify('Programbyggaren öppnas i nästa steg')}><Plus size={17}/> Skapa eget program</button></section>
    <section className="hero-card phase3-hero span-8"><div><span className="status-pill"><Zap size={15}/> Rekommenderat idag</span><h2>{program.name}</h2><p>{program.focus} · {program.duration} minuter · {program.exercises.reduce((n,e)=>n+e.sets.length,0)} arbetsset</p><div className="hero-actions"><button className="primary-button" onClick={()=>startWorkout(program)}><CirclePlay size={18}/> Starta pass</button><button className="text-button" onClick={()=>notify('Programmet duplicerades')}>Duplicera <ArrowRight size={17}/></button></div></div><TimerReset size={90} strokeWidth={1.2}/></section>
    <section className="panel span-8"><SectionHeading eyebrow="Passinnehåll" title="Övningar"/><div className="program-exercises">{program.exercises.map((ex,i)=><div key={ex.id}><span className="exercise-index">{i+1}</span><span><strong>{ex.name}</strong><small>{ex.muscle} · senast {ex.last}</small></span><b>{ex.target}</b></div>)}</div></section>
    <section className="panel span-4"><SectionHeading eyebrow="ATLAS bedömning" title="Belastning"/><div className="load-summary"><strong>68%</strong><span>Optimal zon</span><div className="progress-track"><span style={{width:'68%'}}/></div></div><ul className="clean-list"><li><Check size={16}/> Bröst och armar kan tränas</li><li><Activity size={16}/> Begränsa ländryggsbelastning</li></ul></section>
  </div>
}

function ActiveWorkout({workout,setWorkout,finishWorkout,notify}){
  const [rest,setRest] = useState(null)
  const [confirmFinish,setConfirmFinish] = useState(false)
  useEffect(()=>{
    if(workout.paused) return
    const id=window.setInterval(()=>setWorkout(w=>w?{...w,elapsed:w.elapsed+1}:w),1000)
    return ()=>window.clearInterval(id)
  },[workout.paused,setWorkout])
  useEffect(()=>{
    if(rest===null||rest<=0) return
    const id=window.setInterval(()=>setRest(r=>r-1),1000)
    return ()=>window.clearInterval(id)
  },[rest])
  const completed = workout.exercises.flatMap(e=>e.sets).filter(s=>s.done).length
  const total = workout.exercises.reduce((n,e)=>n+e.sets.length,0)
  const volume = workout.exercises.reduce((sum,e)=>sum+e.sets.filter(s=>s.done).reduce((v,s)=>v+s.kg*s.reps,0),0)
  function updateSet(exIndex,setIndex,patch){
    setWorkout(w=>({...w,exercises:w.exercises.map((ex,ei)=>ei!==exIndex?ex:{...ex,sets:ex.sets.map((s,si)=>si!==setIndex?s:{...s,...patch})})}))
  }
  function completeSet(exIndex,setIndex,restSeconds){
    const set=workout.exercises[exIndex].sets[setIndex]
    updateSet(exIndex,setIndex,{done:!set.done})
    if(!set.done){setRest(restSeconds);notify('Set loggat · vilotimer startad')}
  }
  function end(){
    finishWorkout({name:workout.name,duration:Math.max(1,Math.round(workout.elapsed/60)),volume:Math.round(volume),sets:completed,rating:4})
  }
  return <div className="active-workout">
    <section className="workout-command panel"><div><span className="status-pill"><Flame size={15}/> Aktivt pass</span><h2>{workout.name}</h2><p>{completed} av {total} set klara · {Math.round(volume).toLocaleString('sv-SE')} kg volym</p></div><div className="session-clock"><strong>{formatTime(workout.elapsed)}</strong><button onClick={()=>setWorkout(w=>({...w,paused:!w.paused}))}>{workout.paused?<CirclePlay size={22}/>:<CirclePause size={22}/>}</button></div></section>
    {rest!==null&&rest>0&&<section className="rest-banner"><TimerReset size={20}/><span>Vila</span><strong>{formatTime(rest)}</strong><button onClick={()=>setRest(0)}>Hoppa över</button></section>}
    <div className="workout-progress"><div><span style={{width:`${(completed/total)*100}%`}}/></div><b>{Math.round((completed/total)*100)}%</b></div>
    <div className="active-exercises">{workout.exercises.map((ex,exIndex)=><ExerciseLogger key={ex.id} exercise={ex} exIndex={exIndex} updateSet={updateSet} completeSet={completeSet}/>)}</div>
    <section className="finish-bar panel"><div><strong>{completed}/{total} set</strong><span>{Math.round(volume).toLocaleString('sv-SE')} kg total volym</span></div><button className="primary-button" disabled={completed===0} onClick={()=>setConfirmFinish(true)}><Check size={18}/> Avsluta pass</button></section>
    {confirmFinish&&<div className="modal-backdrop"><div className="finish-modal"><button className="modal-close" onClick={()=>setConfirmFinish(false)}><X size={19}/></button><Trophy size={42}/><h3>Spara träningspass?</h3><p>{completed} set · {Math.round(volume).toLocaleString('sv-SE')} kg · {formatTime(workout.elapsed)}</p><div className="rating-row">{[1,2,3,4,5].map(n=><button key={n} className={n<=4?'selected':''}>★</button>)}</div><button className="primary-button full" onClick={end}>Spara och avsluta</button></div></div>}
  </div>
}

function ExerciseLogger({exercise,exIndex,updateSet,completeSet}){
  const [open,setOpen]=useState(true)
  const done=exercise.sets.filter(s=>s.done).length
  return <section className={`panel exercise-logger ${done===exercise.sets.length?'complete':''}`}>
    <button className="exercise-logger-head" onClick={()=>setOpen(!open)}><span><strong>{exercise.name}</strong><small>{exercise.muscle} · mål {exercise.target}</small></span><span className="set-progress">{done}/{exercise.sets.length}</span><ChevronDown size={18} className={open?'rotated':''}/></button>
    {open&&<div className="set-table"><div className="set-row set-head"><span>Set</span><span>Kg</span><span>Reps</span><span>RPE</span><span>Klar</span></div>{exercise.sets.map((set,i)=><div className={`set-row ${set.done?'done':''}`} key={set.id}><span>{i+1}</span><NumberStepper value={set.kg} step={2.5} onChange={v=>updateSet(exIndex,i,{kg:v})}/><NumberStepper value={set.reps} step={1} onChange={v=>updateSet(exIndex,i,{reps:v})}/><select value={set.rpe} onChange={e=>updateSet(exIndex,i,{rpe:Number(e.target.value)})}>{[6,7,8,9,10].map(v=><option key={v}>{v}</option>)}</select><button className="set-check" onClick={()=>completeSet(exIndex,i,exercise.rest)}>{set.done?<Check size={18}/><span/>:<span/>}</button></div>)}</div>}
  </section>
}

function NumberStepper({value,step,onChange}){return <div className="number-stepper"><button onClick={()=>onChange(Math.max(0,Number((value-step).toFixed(1))))}><Minus size={13}/></button><input value={value} inputMode="decimal" onChange={e=>onChange(Number(e.target.value)||0)}/><button onClick={()=>onChange(Number((value+step).toFixed(1)))}><Plus size={13}/></button></div>}

function HistoryView({history}){return <div className="phase3-grid"><section className="panel span-8"><SectionHeading eyebrow="Sparade pass" title="Träningshistorik"/><div className="history-list">{history.map(item=><div key={item.id}><span className="history-icon"><Dumbbell size={18}/></span><span><strong>{item.name}</strong><small>{item.date} · {item.duration} min · {item.sets} set</small></span><b>{item.volume.toLocaleString('sv-SE')} kg</b><ChevronRight size={18}/></div>)}</div></section><section className="panel span-4"><SectionHeading eyebrow="Senaste 30 dagarna" title="Summering"/><div className="history-stats"><MetricMini value={history.length} label="Pass"/><MetricMini value={`${history.reduce((s,h)=>s+h.duration,0)} min`} label="Träningstid"/><MetricMini value={`${Math.round(history.reduce((s,h)=>s+h.volume,0)/1000)} t`} label="Volym"/></div></section></div>}

function ProgressView({history}){
  const chart=[62,66,65,70,72.5,72.5,75]
  return <div className="phase3-grid"><section className="panel span-8"><SectionHeading eyebrow="Bänkpress" title="Styrkeutveckling"/><div className="progress-chart">{chart.map((v,i)=><div key={i}><b>{v}</b><span style={{height:`${(v/80)*100}%`}}/><small>V{i+1}</small></div>)}</div></section><section className="panel span-4"><SectionHeading eyebrow="Personbästa" title="Senaste framsteg"/><div className="pr-card"><Trophy size={28}/><strong>75 kg × 6</strong><span>Beräknat 1RM: 90 kg</span></div><div className="progress-kpis"><MetricMini value="+3,4%" label="4 veckor"/><MetricMini value="4" label="Nya rekord"/></div></section><section className="panel span-12"><SectionHeading eyebrow="ATLAS progression" title="Nästa rekommendation"/><div className="recommendation-row"><Sparkles size={24}/><span><strong>Testa 75 kg i första setet nästa gång</strong><small>Du har klarat målreps med RPE 8 eller lägre i två pass.</small></span><button className="secondary-button">Lägg in i program</button></div></section></div>
}

function EmptyWorkout({onStart}){return <section className="panel empty-workout"><div className="coach-orb"><Dumbbell size={38}/></div><h2>Inget aktivt pass</h2><p>Starta dagens rekommenderade program och logga varje set direkt under träningen.</p><button className="primary-button" onClick={onStart}><CirclePlay size={18}/> Starta Överkropp A</button></section>}

function TodayPage({startWorkout,navigate}){return <div className="dashboard-grid"><section className="hero-card span-8"><div><span className="status-pill"><Sparkles size={15}/> Dagens rekommendation</span><h2>Överkropp · styrka</h2><p>Din återhämtning är stabil. Håll två repetitioner i reserv på de tyngsta seten.</p><div className="hero-actions"><button className="primary-button" onClick={()=>startWorkout(programs[0])}><Dumbbell size={18}/> Starta pass</button><button className="text-button" onClick={()=>navigate('train')}>Visa program <ArrowRight size={17}/></button></div></div><div className="readiness-ring"><span>82</span><small>Redo</small></div></section><MetricCard className="span-4" icon={Activity} label="Återhämtning" value="82%" note="Optimal träningsdag"/><MetricCard className="span-4" icon={Flame} label="Veckobelastning" value="68%" note="Inom optimal zon"/><MetricCard className="span-4" icon={TrendingUp} label="Progression" value="+3,4%" note="Senaste 4 veckorna"/><MetricCard className="span-4" icon={Target} label="Veckomål" value="2 / 4" note="Två pass kvar"/></div>}

function BodyPage(){return <div className="body-dashboard"><section className="panel body-command"><div><span className="status-pill"><Activity size={15}/> Levande kroppskarta</span><h2>Kroppen styr nästa beslut</h2><p>Bröst och armar är redo. Ländrygg och vader behöver återhämtning.</p></div><div className="body-summary"><SummaryStat value="8" label="Redo" tone="ready"/><SummaryStat value="6" label="Belastade" tone="loaded"/><SummaryStat value="3" label="Vila" tone="attention"/></div></section><section className="panel anatomy-panel body-placeholder"><div className="body-mini"><span/><i className="chest"/><i className="legs"/></div><div className="legend"><span><i className="ready"/>Redo</span><span><i className="loaded"/>Belastad</span><span><i className="attention"/>Uppmärksamhet</span></div></section><section className="panel muscle-detail"><SectionHeading eyebrow="Dagens fokus" title="Överkropp"/><div className="detail-metrics"><DetailMetric label="Bröst" value="72%"/><DetailMetric label="Rygg" value="58%"/><DetailMetric label="Axlar" value="61%"/></div><p className="muted-copy">Den fulla interaktiva kroppskartan från fas 2 ligger kvar i projektets föregående implementation och kan kopplas till träningsloggen i nästa datalager.</p></section></div>}

function NutritionPage({notify}){return <div className="dashboard-grid"><section className="hero-card nutrition-hero span-8"><div><span className="status-pill"><Apple size={15}/> Dagens energi</span><h2>1 420 av 2 050 kcal</h2><p>Prioritera protein och grönsaker i nästa måltid.</p><button className="primary-button" onClick={()=>notify('Måltidslogg öppnad')}><Plus size={18}/> Logga måltid</button></div><div className="macro-donut"><span>69%</span></div></section><MetricCard className="span-4" icon={Flame} label="Kvar idag" value="630 kcal" note="Flexibelt utrymme"/></div>}
function CoachPage({notify}){return <div className="coach-layout"><section className="coach-intro"><div className="coach-orb"><Bot size={42}/></div><span className="status-pill"><Sparkles size={15}/> Personlig analys</span><h2>Vad vill du ha hjälp med?</h2><p>ATLAS väger samman träningslogg, återhämtning, mål och upplevd ansträngning.</p></section><div className="prompt-grid">{['Hur bör jag träna idag?','Analysera mitt senaste pass','Justera progressionen'].map(prompt=><button key={prompt} onClick={()=>notify('Frågan skickades')}><Sparkles size={18}/><span>{prompt}</span><ArrowRight size={18}/></button>)}</div></div>}

function Brand(){return <div className="brand"><div className="brand-mark">A</div><div><strong>ATLAS</strong><small>TRAIN SMARTER</small></div></div>}
function NavButton({item,active,onClick,compact=false}){const Icon=item.icon;return <button className={`nav-button ${active?'active':''} ${compact?'compact':''}`} onClick={onClick}><Icon size={20}/><span>{item.label}</span></button>}
function SectionHeading({eyebrow,title}){return <div className="section-heading"><div><span>{eyebrow}</span><h3>{title}</h3></div></div>}
function MetricCard({icon:Icon,label,value,note,className=''}){return <article className={`metric-card ${className}`}><div className="metric-icon"><Icon size={20}/></div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>}
function MetricMini({value,label}){return <div className="metric-mini"><strong>{value}</strong><span>{label}</span></div>}
function SummaryStat({value,label,tone}){return <div className={`summary-stat ${tone}`}><strong>{value}</strong><span>{label}</span></div>}
function DetailMetric({label,value}){return <div><span>{label}</span><strong>{value}</strong></div>}
function formatTime(total){const m=Math.floor(total/60).toString().padStart(2,'0');const s=(total%60).toString().padStart(2,'0');return `${m}:${s}`}

export default App3
