import './phase4.css'
import { ActionButton, BottomNavigation, Card, ExerciseRow, ProgressRing, SectionTitle as AtlasSectionTitle, StatCard, WorkoutCard } from './atlasDesignSystem'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, Apple, Archive, ArrowDown, ArrowUp, BarChart3, Bot, CalendarDays, Check,
  AlertCircle,
  ChevronRight, Clipboard, Copy, Download, Dumbbell, FileUp, Flame, GripVertical,
  HeartPulse, History, Library, Moon, ListFilter, MoreHorizontal, Pencil, Play, Plus,
  QrCode, Search, Share2, Sparkles, Star, Target, Trash2, Utensils, Trophy, Upload, X, Clock, Pause, SkipForward, Waves
} from 'lucide-react'

const exerciseBank = [
  {id:'bench',name:'Bänkpress',muscle:'Bröst',secondary:'Triceps · främre axlar',equipment:'Skivstång',level:'Medel',gym:'Alla gym',score:96,sets:'4 × 6–8',type:'Compound',mode:'Barbell',favorite:true,recent:true,custom:false},
  {id:'row',name:'Sittande rodd',muscle:'Rygg',secondary:'Biceps · bakre axlar',equipment:'Kabel',level:'Nybörjare',gym:'Nordic Wellness',score:94,sets:'4 × 8–10',type:'Compound',mode:'Cable',favorite:true,recent:true,custom:false},
  {id:'squat',name:'Knäböj',muscle:'Framsida lår',secondary:'Säte · bål',equipment:'Skivstång',level:'Avancerad',gym:'Alla gym',score:98,sets:'4 × 5–8',type:'Compound',mode:'Barbell',favorite:false,recent:true,custom:false},
  {id:'pulldown',name:'Latsdrag',muscle:'Lats',secondary:'Biceps · övre rygg',equipment:'Kabel',level:'Nybörjare',gym:'Fitness24Seven',score:95,sets:'3 × 8–12',type:'Compound',mode:'Cable',favorite:false,recent:false,custom:false},
  {id:'ohp',name:'Axelpress',muscle:'Axlar',secondary:'Triceps',equipment:'Hantlar',level:'Medel',gym:'Alla gym',score:91,sets:'3 × 8–10',type:'Compound',mode:'Dumbbell',favorite:false,recent:false,custom:false},
  {id:'legpress',name:'Benpress',muscle:'Framsida lår',secondary:'Säte',equipment:'Maskin',level:'Nybörjare',gym:'Nordic Wellness',score:93,sets:'4 × 10',type:'Compound',mode:'Machine',favorite:false,recent:false,custom:false},
  {id:'rdl',name:'Raka marklyft',muscle:'Baksida lår',secondary:'Säte · ländrygg',equipment:'Skivstång',level:'Medel',gym:'Alla gym',score:95,sets:'3 × 8',type:'Compound',mode:'Barbell',favorite:false,recent:false,custom:false},
  {id:'curl',name:'Bicepscurl',muscle:'Biceps',secondary:'Underarmar',equipment:'Hantlar',level:'Nybörjare',gym:'Alla gym',score:87,sets:'3 × 10–12',type:'Isolation',mode:'Dumbbell',favorite:true,recent:false,custom:false},
  {id:'pushdown',name:'Triceps pushdown',muscle:'Triceps',secondary:'—',equipment:'Kabel',level:'Nybörjare',gym:'Alla gym',score:90,sets:'3 × 10–12',type:'Isolation',mode:'Cable',favorite:false,recent:false,custom:false},
  {id:'hipthrust',name:'Hip thrust',muscle:'Säte',secondary:'Baksida lår',equipment:'Skivstång',level:'Medel',gym:'Fitness24Seven',score:96,sets:'4 × 8'},
  {id:'calf',name:'Vadpress',muscle:'Vader',secondary:'—',equipment:'Maskin',level:'Nybörjare',gym:'Nordic Wellness',score:86,sets:'4 × 12–15'},
  {id:'plank',name:'Planka',muscle:'Bål',secondary:'Axlar',equipment:'Kroppsvikt',level:'Nybörjare',gym:'Alla gym',score:88,sets:'3 × 45 s'}
]

const defaultPrograms = [
  {id:'upper-a',name:'Överkropp A',type:'Upper/Lower',days:4,favorite:true,archived:false,cover:'/assets/program-covers/upper-a.svg',muscleFigure:'/assets/muscle-figures/back.svg',muscleFigureAlt:'Bakre muskelkarta med rygg, axlar och armar markerade',exercises:['bench','row','ohp','pulldown','pushdown','curl']},
  {id:'lower-a',name:'Underkropp A',type:'Upper/Lower',days:4,favorite:true,archived:false,cover:'/assets/program-covers/lower-a.svg',muscleFigure:'/assets/muscle-figures/front.svg',muscleFigureAlt:'Främre muskelkarta med lår och bål markerade',exercises:['squat','rdl','legpress','calf','plank']},
  {id:'fullbody',name:'Helkropp 50+',type:'Helkropp',days:2,favorite:false,archived:false,exercises:['legpress','bench','row','rdl','ohp','plank']},
  {id:'push',name:'Push',type:'PPL',days:6,favorite:false,archived:false,exercises:['bench','ohp','pushdown']},
  {id:'pull',name:'Pull',type:'PPL',days:6,favorite:false,archived:false,exercises:['pulldown','row','curl','rdl']},
  {id:'legs',name:'Legs',type:'PPL',days:6,favorite:false,archived:false,exercises:['squat','legpress','rdl','calf']}
]

const demoHistory = [
  {id:1,date:'2026-07-18',name:'Överkropp A',sets:18,volume:8240,duration:58,gym:'Nordic Wellness'},
  {id:2,date:'2026-07-16',name:'Underkropp A',sets:17,volume:11260,duration:64,gym:'Fitness24Seven'},
  {id:3,date:'2026-07-13',name:'Överkropp A',sets:18,volume:7890,duration:55,gym:'Nordic Wellness'},
  {id:4,date:'2026-07-11',name:'Helkropp 50+',sets:16,volume:9350,duration:61,gym:'Hemmagym'}
]

const assetFallbackLabels = {
  program: 'Programbild saknas',
  exercise: 'Övningsbild saknas',
  muscle: 'Muskelkarta saknas',
  coach: 'Coachbild saknas',
  food: 'Matbild saknas',
  progress: 'Progressgrafik saknas'
}

const atlasAssets = {
  programCovers: { upperA: '/assets/program-covers/upper-a.svg' },
  muscleFigures: { front: '/assets/muscle-figures/front.svg', back: '/assets/muscle-figures/back.svg' },
  exercises: {},
  coach: {},
  food: {},
  progress: {}
}

const workoutIntelligence = {
  recoveryStatus: '82% redo · bröst och rygg gröna, axlar lätt belastade',
  previousSummary: 'Senast: 58 min · 18 set · 8 240 kg · 2 PR',
  expectedVolume: 7840,
  difficulty: 'Medelhög',
  nextWorkout: 'Underkropp A · onsdag',
  notes: 'Prioritera tempo före maxvikt. Lämna 1–2 reps i reserv på pressövningar.'
}

const muscleContribution = {
  bench:{Bröst:1,Triceps:.55,Axlar:.35}, row:{Rygg:1,Biceps:.5,Axlar:.25}, squat:{Ben:1,Säte:.6,Bål:.35},
  pulldown:{Rygg:1,Biceps:.55}, ohp:{Axlar:1,Triceps:.5}, legpress:{Ben:1,Säte:.45}, rdl:{'Baksida lår':1,Säte:.65,Rygg:.25},
  curl:{Biceps:1,Underarmar:.35}, pushdown:{Triceps:1}, hipthrust:{Säte:1,'Baksida lår':.45}, calf:{Vader:1}, plank:{Bål:1,Axlar:.2}
}

function loadState(){
  try{return JSON.parse(localStorage.getItem('atlas-phase4'))||{}}
  catch{return {}}
}

export default function AppPhase4(){
  const saved=useMemo(loadState,[])
  const [page,setPage]=useState(saved.page||'dashboard')
  const [programs,setPrograms]=useState(saved.programs||defaultPrograms)
  const [history,setHistory]=useState(saved.history||demoHistory)
  const [activeProgramId,setActiveProgramId]=useState(saved.activeProgramId||'upper-a')
  const [session,setSession]=useState(saved.session||null)
  const [toast,setToast]=useState('')
  const [modal,setModal]=useState(null)
  const [completedWorkout,setCompletedWorkout]=useState(saved.completedWorkout||null)
  const fileInput=useRef(null)

  useEffect(()=>{localStorage.setItem('atlas-phase4',JSON.stringify({page,programs,history,activeProgramId,session,completedWorkout}))},[page,programs,history,activeProgramId,session,completedWorkout])
  const notify=m=>{setToast(m);setTimeout(()=>setToast(''),2200)}
  const startProgram=program=>{
    const exercises=program.exercises.map(id=>{
      const ex=exerciseBank.find(x=>x.id===id)
      const [setCount]=ex.sets.match(/\d+/)||[3]
      return {...ex,sets:Array.from({length:Number(setCount)},(_,i)=>({id:`${id}-${i}`,kg:previousKg(id),reps:8,rpe:8,tempo:'3-1-1',rest:90,done:false}))}
    })
    setSession({id:Date.now(),programId:program.id,name:program.name,startedAt:Date.now(),exercises})
    setPage('session');notify('Pass startat')
  }
  const previousKg=id=>({bench:75,row:70,squat:85,pulldown:80,ohp:24,legpress:150,rdl:80,curl:14,pushdown:32,hipthrust:100,calf:70,plank:0}[id]||20)
  const finishSession=()=>{
    if(!session)return
    const sets=session.exercises.flatMap(e=>e.sets).filter(s=>s.done)
    const volume=sets.reduce((sum,s)=>sum+s.kg*s.reps,0)
    const completed={id:Date.now(),date:new Date().toISOString().slice(0,10),name:session.name,sets:sets.length,volume:Math.round(volume),duration:Math.max(1,Math.round((Date.now()-session.startedAt)/60000)),gym:'Nordic Wellness',prs:Math.min(3,Math.max(1,sets.filter(s=>s.rpe>=9).length)),calories:Math.round(sets.length*18+volume/95),recovery:sets.length>14?'36–42 timmar':'24–30 timmar'}
    setHistory(h=>[completed,...h])
    setCompletedWorkout(completed)
    setSession(null);setPage('history');notify('Pass sparat')
  }
  const exportData=()=>{
    const blob=new Blob([JSON.stringify({programs,history},null,2)],{type:'application/json'})
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='atlas-export.json';a.click();URL.revokeObjectURL(url);notify('Export skapad')
  }
  const importData=e=>{
    const file=e.target.files?.[0];if(!file)return
    const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);if(data.programs)setPrograms(data.programs);if(data.history)setHistory(data.history);notify('Data importerad')}catch{notify('Filen kunde inte läsas')}};reader.readAsText(file)
  }

  const nav=[['dashboard','Home',Activity],['programs','Program',Library],['session','Workout',Dumbbell],['recovery','Recovery',HeartPulse],['coach','AI Coach',Bot],['food','Food',Utensils],['progress','Progress',BarChart3]]
  const bottomNavItems = nav.map(([id, label, icon]) => ({ id, label, icon }))
  return <div className="p4-shell">
    <aside className="p4-sidebar"><div className="p4-brand"><span><img src="/assets/branding/logos/askr-logo-primary-light.png" alt="ASKR" /></span><div><strong>ATLAS</strong><small>INTELLIGENT TRAINING</small></div></div><nav>{nav.map(([id,label,Icon])=><button key={id} className={page===id?'active':''} onClick={()=> id==='session' && !session ? setPage('programs') : setPage(id)}><Icon size={19}/><span>{label}</span></button>)}</nav><div className="p4-side-tools"><button onClick={exportData}><Download size={17}/>Exportera</button><button onClick={()=>fileInput.current?.click()}><Upload size={17}/>Importera</button><input ref={fileInput} type="file" accept="application/json" hidden onChange={importData}/></div></aside>
    <main className="p4-main"><header className="p4-top"><div><span className="eyebrow">Fas 4</span><h1>{titleFor(page)}</h1><p>{subtitleFor(page)}</p></div><div><button className="p4-icon" onClick={()=>setModal('share')}><Share2 size={19}/></button><button className="p4-primary" onClick={()=>setModal('new-program')}><Plus size={18}/>Nytt program</button></div></header>
      {page==='dashboard'&&<Dashboard programs={programs} history={history} startProgram={startProgram} setPage={setPage}/>}
      {page==='programs'&&<ProgramLibrary programs={programs} setPrograms={setPrograms} activeProgramId={activeProgramId} setActiveProgramId={setActiveProgramId} startProgram={startProgram} notify={notify}/>}
      {page==='exercises'&&<ExerciseLibrary notify={notify}/>}
      {page==='calendar'&&<CalendarView history={history}/>}
      {page==='history'&&<HistoryView history={history} completedWorkout={completedWorkout}/>}
      {page==='stats'&&<StatsView history={history}/>}
      {page==='food'&&<FoodView notify={notify}/>}
      {page==='progress'&&<StatsView history={history}/>}
      {page==='recovery'&&<RecoveryView/>}
      {page==='coach'&&<CoachView notify={notify}/>}
      {page==='session'&&session&&<LiveSession session={session} setSession={setSession} finishSession={finishSession}/>}
      {page==='session'&&!session&&<WorkoutLanding programs={programs} startProgram={startProgram}/>}
      <BottomNavigation items={bottomNavItems} active={page} onChange={id=> id==='session' && !session ? setPage('programs') : setPage(id)} />
    </main>
    {modal==='new-program'&&<NewProgramModal onClose={()=>setModal(null)} onCreate={p=>{setPrograms(x=>[...x,p]);setModal(null);setActiveProgramId(p.id);setPage('programs');notify('Program skapat')}}/>}
    {modal==='share'&&<ShareModal programs={programs} onClose={()=>setModal(null)} notify={notify}/>}
    {toast&&<div className="p4-toast">{toast}</div>}
  </div>
}

const titleFor=p=>({dashboard:'Din träning',programs:'Program',exercises:'Övningsbank',calendar:'Kalender',history:'Workout complete',stats:'Progress',food:'Food',progress:'Progress',recovery:'Recovery',coach:'ATLAS Coach',session:'Aktivt pass'}[p]||'ATLAS')
const subtitleFor=p=>({dashboard:'Allt du behöver för nästa smarta beslut.',programs:'Skapa, redigera och starta dina program.',exercises:'Sök och filtrera bland övningar och maskiner.',calendar:'Se rytm, kontinuitet och planerade pass.',history:'Summering efter avslutat pass.',stats:'Volym, progression och muskelbalans.',food:'Energi, protein och måltider med premiumöversikt.',progress:'Volym, progression och muskelbalans.',recovery:'Sömn, readiness och belastning i en lugn OLED-vy.',coach:'Din smarta coachvy utan ny AI-logik.',session:'Logga varje set utan att lämna vyn.'}[p]||'')

function AtlasAsset({ src, alt, ratio='16 / 10', fit='cover', fallback='Asset redo' }){
  const [failed,setFailed]=useState(!src)
  return <div className={`atlas-asset ${failed?'missing':''}`} style={{'--asset-ratio':ratio}}>{!failed&&<img src={src} alt={alt} loading="lazy" style={{objectFit:fit}} onError={()=>setFailed(true)}/>} {failed&&<span>{fallback}</span>}</div>
}


function programExercises(program){return (program?.exercises||[]).map(id=>exerciseBank.find(exercise=>exercise.id===id)).filter(Boolean)}
function programMeta(program,history=[]){
  const exercises=programExercises(program);const sets=exercises.reduce((sum,e)=>sum+Number((e.sets.match(/\d+/)||[3])[0]),0)
  const muscles=[...new Set(exercises.flatMap(e=>[e.muscle,...(e.secondary||'').split(' · ').filter(x=>x&&x!=='—')]))].slice(0,5)
  const equipment=[...new Set(exercises.map(e=>e.equipment))].join(' · ')||'Blandad'
  const level=program?.name?.includes('50+')?'Åldersanpassad':exercises.some(e=>e.level==='Avancerad')?'Avancerad':exercises.some(e=>e.level==='Medel')?'Medel':'Nybörjare'
  const goal=program?.type==='PPL'?'Hypertrofi och volym':program?.type==='Helkropp'?'Generell styrka och rörlighet':program?.type==='Upper/Lower'?'Styrka och muskeltillväxt':'Eget mål'
  const duration=program?.type==='PPL'?8:program?.type==='Helkropp'?6:10
  const sessionLength=Math.max(35,Math.min(75,Math.round(sets*3.4)))
  const completed=history.filter(h=>h.name===program?.name).length
  return {exercises,sets,muscles,equipment,level,goal,duration,sessionLength,completed,phase:completed>duration*(program?.days||0)*.75?'Peak':completed>duration*(program?.days||0)*.35?'Build':'Base'}
}

function Dashboard({programs,history,startProgram,setPage}){
  const active=programs.find(program=>program.id==='upper-a')||programs[0];const meta=programMeta(active,history)
  const week=history.slice(0,4);const completedThisWeek=week.length;const totalSessions=meta.duration*(active?.days||0);const adherence=Math.min(100,Math.round(completedThisWeek/Math.max(1,active?.days||1)*100))
  return <div className="program-dashboard"><section className="p4-hero span8 program-hero"><div><span className="pill"><Sparkles size={15}/>Aktivt program</span><h2>{active?.name||'Inget aktivt program'}</h2><p>{active?`${meta.goal}. Vecka 3 av ${meta.duration} · fas ${meta.phase}. Nästa steg är tydligt: starta rekommenderat pass när du är redo.`:'Välj ett program i biblioteket för att få en tydlig plan.'}</p><div className="overview-meta"><span><CalendarDays size={14}/>Vecka 3 / {meta.duration}</span><span><Dumbbell size={14}/>{active?.days||0} dagar/vecka</span><span><Clock size={14}/>{meta.sessionLength} min/pass</span><span><Target size={14}/>{meta.muscles.slice(0,3).join(' · ')}</span></div><div className="hero-actions"><button className="p4-primary" onClick={()=>startProgram(active)}><Play size={18}/>Starta nästa workout</button><button className="p4-secondary" onClick={()=>setPage('programs')}>Visa programdetaljer</button></div></div><div className="program-orbit"><strong>{adherence}%</strong><span>adherence</span></div></section>
    <section className="panel span4 next-action-panel"><SectionTitle eyebrow="Nästa action" title="Redo att starta"/><p>{workoutIntelligence.notes}</p><button className="p4-primary full" onClick={()=>startProgram(active)}><Play size={17}/>Starta nu</button><button className="p4-secondary full" onClick={()=>setPage('programs')}>Byt eller redigera</button></section>
    <Kpi icon={CalendarDays} label="Planerade pass" value={totalSessions}/><Kpi icon={Check} label="Genomförda" value={meta.completed}/><Kpi icon={Target} label="Arbetsset" value={meta.sets}/><Kpi icon={Trophy} label="Fas" value={meta.phase}/>
    <section className="panel span7"><SectionTitle eyebrow="Weekly schedule" title="Den här veckan"/><div className="program-week-grid">{Array.from({length:active?.days||0},(_,i)=>{const done=i<completedThisWeek;const ex=meta.exercises[i%Math.max(1,meta.exercises.length)];return <article key={i} className={done?'done':i===completedThisWeek?'today':''}><b>{done?<Check size={16}/>:i+1}</b><span><strong>{i%2?'Underkropp / Pull':'Överkropp / Push'}</strong><small>{done?'Genomfört':i===completedThisWeek?'Nästa rekommenderade pass':'Kommande'} · {ex?.name}</small></span></article>})}</div></section>
    <section className="panel span5"><ProgramProgress program={active} meta={meta}/></section>
    <section className="panel span7"><SectionTitle eyebrow="Senaste aktivitet" title="Recent workouts"/><div className="recent-workouts">{history.slice(0,4).map(item=><div key={item.id}><History size={18}/><span><strong>{item.name}</strong><small>{item.date} · {item.sets} set · {item.duration} min</small></span><b>{item.volume.toLocaleString('sv-SE')} kg</b></div>)}</div></section>
    <section className="panel span5"><SectionTitle eyebrow="Quick actions" title="Hantera program"/><div className="quick-start-grid"><button onClick={()=>setPage('programs')}><Library size={18}/><span><strong>Bläddra bibliotek</strong><small>Sök, filtrera och jämför program</small></span></button><button onClick={()=>setPage('programs')}><Pencil size={18}/><span><strong>Redigera aktivt</strong><small>Ändra namn, dagar och övningsordning</small></span></button></div></section>
  </div>
}

function ProgramProgress({program,meta}){return <div className="program-progress"><SectionTitle eyebrow="Programdata" title="Progression"/><div className="program-facts"><div><span>Duration</span><strong>{meta.duration} veckor</strong></div><div><span>Frequency</span><strong>{program?.days} dagar/vecka</strong></div><div><span>Level</span><strong>{meta.level}</strong></div><div><span>Equipment</span><strong>{meta.equipment}</strong></div></div><p>Fokus: {meta.muscles.join(' · ')}. Återhämtning: 24–48 timmar mellan liknande muskelgrupper.</p></div>}

function ProgramLibrary({programs,setPrograms,activeProgramId,setActiveProgramId,startProgram,notify}){
  const [filter,setFilter]=useState('alla');const active=programs.find(p=>p.id===activeProgramId)||programs[0]
  const visible=programs.filter(p=>filter==='arkiv'?p.archived:!p.archived&&(filter==='favorit'?p.favorite:true))
  const update=(id,patch)=>setPrograms(ps=>ps.map(p=>p.id===id?{...p,...patch}:p))
  const move=(index,dir)=>{const next=[...active.exercises];const target=index+dir;if(target<0||target>=next.length)return;[next[index],next[target]]=[next[target],next[index]];update(active.id,{exercises:next})}
  const removeExercise=id=>update(active.id,{exercises:active.exercises.filter(x=>x!==id)})
  const addExercise=id=>{if(!active.exercises.includes(id))update(active.id,{exercises:[...active.exercises,id]})}
  return <div className="program-layout"><section className="panel program-list"><div className="toolbar"><div className="segmented">{[['alla','Aktiva'],['favorit','Favoriter'],['arkiv','Arkiv']].map(([id,l])=><button key={id} className={filter===id?'active':''} onClick={()=>setFilter(id)}>{l}</button>)}</div></div><div className="program-cards">{visible.map(p=><button key={p.id} className={activeProgramId===p.id?'selected':''} onClick={()=>setActiveProgramId(p.id)}><span className="program-card-figure"><AtlasAsset src={p.muscleFigure || atlasAssets.muscleFigures.front} alt={p.muscleFigureAlt || `${p.name} målmuskelkarta`} ratio="3 / 4" fit="contain" fallback={assetFallbackLabels.muscle}/></span><span><strong>{p.name}</strong><small>{p.type} · {p.exercises.length} övningar</small></span>{p.favorite&&<Star size={16} fill="currentColor"/>}<ChevronRight size={17}/></button>)}</div></section>
    {active&&<section className="panel program-editor"><div className="editor-head"><div><span className="eyebrow">Programeditor</span><input value={active.name} onChange={e=>update(active.id,{name:e.target.value})}/><p>{active.type} · {active.days} dagar/vecka</p></div><div><button className="p4-icon" onClick={()=>update(active.id,{favorite:!active.favorite})}><Star size={18} fill={active.favorite?'currentColor':'none'}/></button><button className="p4-icon" onClick={()=>update(active.id,{archived:!active.archived})}><Archive size={18}/></button><button className="p4-primary" onClick={()=>startProgram(active)}><Play size={17}/>Starta</button></div></div>
      <div className="editor-list">{active.exercises.map((id,i)=>{const ex=exerciseBank.find(x=>x.id===id);return <div key={id}><GripVertical size={18}/><span><strong>{ex.name}</strong><small>{ex.muscle} · {ex.sets}</small></span><div className="move-buttons"><button onClick={()=>move(i,-1)}><ArrowUp size={15}/></button><button onClick={()=>move(i,1)}><ArrowDown size={15}/></button><button onClick={()=>removeExercise(id)}><Trash2 size={15}/></button></div></div>})}</div>
      <details className="add-exercise"><summary><Plus size={17}/>Lägg till övning</summary><div>{exerciseBank.filter(e=>!active.exercises.includes(e.id)).map(e=><button key={e.id} onClick={()=>{addExercise(e.id);notify(`${e.name} tillagd`)}}><span><strong>{e.name}</strong><small>{e.muscle}</small></span><Plus size={16}/></button>)}</div></details>
    </section>}
  </div>
}

function ExerciseLibrary({notify}){
  const [query,setQuery]=useState('');const [muscle,setMuscle]=useState('Alla');const [equipment,setEquipment]=useState('Alla');const [type,setType]=useState('Alla');const [quick,setQuick]=useState('all');const [selected,setSelected]=useState(exerciseBank[0]);const [favorite,setFavorite]=useState({bench:true,row:true,curl:true})
  const categories=['all','favorites','recent','custom'];const muscles=['Alla',...new Set(exerciseBank.map(e=>e.muscle))];const equipmentOptions=['Alla',...new Set(exerciseBank.map(e=>e.equipment)), 'Machine','Cable','Dumbbell','Barbell']
  const filtered=exerciseBank.filter(e=>(e.name+e.muscle+e.secondary+e.equipment+e.type+e.mode).toLowerCase().includes(query.toLowerCase())&&(muscle==='Alla'||e.muscle===muscle)&&(equipment==='Alla'||e.equipment===equipment||e.mode===equipment)&&(type==='Alla'||e.type===type)&&(quick==='all'||(quick==='favorites'&&(favorite[e.id]||e.favorite))||(quick==='recent'&&e.recent)||(quick==='custom'&&e.custom)))
  const secondary=selected.secondary==='—'?[]:selected.secondary.split(' · ')
  return <div className="exercise-layout premium-browser"><section className="panel exercise-browser"><SectionTitle eyebrow="Exercise Browser" title="Snabb övningssök"/><div className="search-box fast-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Sök övning, muskel, utrustning…" autoComplete="off"/></div><div className="category-chips">{categories.map(id=><button key={id} className={quick===id?'active':''} onClick={()=>setQuick(id)}>{id==='all'?'Alla':id==='favorites'?'Favoriter':id==='recent'?'Nyligen': 'Custom'}</button>)}</div><div className="filter-selects"><select value={muscle} onChange={e=>setMuscle(e.target.value)}>{muscles.map(x=><option key={x}>{x}</option>)}</select><select value={equipment} onChange={e=>setEquipment(e.target.value)}>{equipmentOptions.map(x=><option key={x}>{x}</option>)}</select><select value={type} onChange={e=>setType(e.target.value)}>{['Alla','Compound','Isolation'].map(x=><option key={x}>{x}</option>)}</select></div><div className="exercise-results large-cards">{filtered.map(e=><button key={e.id} className={selected.id===e.id?'selected':''} onClick={()=>setSelected(e)}><span className="score">{e.score}</span><span><strong>{e.name}</strong><small>{e.muscle} · {e.equipment} · {e.type||'Compound'}</small></span>{(favorite[e.id]||e.favorite)&&<Star size={16} fill="currentColor"/>}<ChevronRight size={17}/></button>)}</div></section>
    <section className="panel exercise-detail premium-detail"><div className="exercise-visual"><AtlasAsset src={selected.image} alt={`${selected.name} hero`} ratio="16 / 8" fit="cover" fallback={assetFallbackLabels.exercise}/><span>STARTPOSITION</span><span>SLUTPOSITION</span></div><div className="detail-headline"><span className="pill">Exercise Score {selected.score}%</span><button className="p4-icon" aria-label="Favorit" onClick={()=>setFavorite(f=>({...f,[selected.id]:!f[selected.id]}))}><Star size={18} fill={(favorite[selected.id]||selected.favorite)?'currentColor':'none'}/></button></div><h2>{selected.name}</h2><p>{selected.muscle} · sekundärt: {secondary.join(' · ')||'ingen'} · current recovery 82%</p><div className="detail-grid"><div><span>Primary muscles</span><strong>{selected.muscle}</strong></div><div><span>Secondary muscles</span><strong>{secondary.join(' · ')||'—'}</strong></div><div><span>Difficulty</span><strong>{selected.level}</strong></div><div><span>Equipment</span><strong>{selected.equipment}</strong></div><div><span>Exercise type</span><strong>{selected.type||'Compound'}</strong></div><div><span>Training load</span><strong>{selected.score>94?'Hög effekt':'Kontrollerad'}</strong></div></div><MuscleVolume compact live={muscleContribution[selected.id]||{[selected.muscle]:1}}/><div className="instruction"><h3>Instruktioner</h3><ol><li>Bygg en stabil startposition och kontrollera andningen.</li><li>Flytta vikten genom full, smärtfri rörelse med jämnt tempo.</li><li>Avsluta setet när tekniken bryts eller planerad RPE uppnås.</li></ol><h3>Common mistakes</h3><p>För hög belastning, kort rörelsebana och tappad bålspänning som flyttar arbetet från målmuskel.</p><h3>Tips</h3><p>{techniqueTip(selected.id)}</p><h3>Previous workouts · PR · Volume history · Notes</h3><p>{previousPerformance(selected.id)} · PR estimeras från RPE 9+ · volymtrend +6% · anteckningar sparas per set i Workout Engine.</p></div><button className="p4-primary full" onClick={()=>notify('Övningen tillagd i favoriter')}><Star size={17}/>Spara övning</button></section>
  </div>
}

function LiveSession({session,setSession,finishSession}){
  const [activeIndex,setActiveIndex]=useState(0)
  const [restSeconds,setRestSeconds]=useState(75)
  const [restPaused,setRestPaused]=useState(false)
  const active=session.exercises[activeIndex]
  const allSets=session.exercises.flatMap(e=>e.sets);const done=allSets.filter(s=>s.done).length
  const total=allSets.length;const remaining=total-done
  const elapsedMinutes=Math.max(1,Math.round((Date.now()-session.startedAt)/60000))
  const eta=new Date(Date.now()+Math.max(8,remaining*3)*60000).toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'})
  const activeDone=active.sets.filter(s=>s.done).length
  useEffect(()=>{if(restPaused||restSeconds<=0)return;const id=setInterval(()=>setRestSeconds(v=>Math.max(0,v-1)),1000);return()=>clearInterval(id)},[restPaused,restSeconds])
  const updateSet=(si,patch)=>setSession(s=>({...s,exercises:s.exercises.map((e,ei)=>ei!==activeIndex?e:{...e,sets:e.sets.map((set,i)=>i===si?{...set,...patch}:set)})}))
  const addSet=()=>setSession(s=>({...s,exercises:s.exercises.map((e,ei)=>ei!==activeIndex?e:{...e,sets:[...e.sets,{...e.sets[e.sets.length-1],id:`${e.id}-${Date.now()}`,done:false}]})}))
  const deleteSet=si=>setSession(s=>({...s,exercises:s.exercises.map((e,ei)=>ei!==activeIndex?e:{...e,sets:e.sets.filter((_,i)=>i!==si)})}))
  const skipExercise=()=>setActiveIndex(i=>Math.min(session.exercises.length-1,i+1))
  const quickWeight=delta=>active.sets.forEach((set,i)=>!set.done&&updateSet(i,{kg:Math.max(0,Number(set.kg)+delta)}))
  const repeatLast=()=>active.sets.forEach((set,i)=>!set.done&&updateSet(i,{kg:previousKg(active.id)}))
  const [autoRest,setAutoRest]=useState(true)
  const toggleDone=(i,set)=>{updateSet(i,{done:!set.done});if(!set.done&&autoRest){setRestSeconds(90);setRestPaused(false)}}
  const load=useMemo(()=>{const result={};session.exercises.forEach(e=>e.sets.filter(s=>s.done).forEach(s=>Object.entries(muscleContribution[e.id]||{}).forEach(([m,w])=>result[m]=(result[m]||0)+w)));return result},[session])
  return <div className="premium-session"><section className="panel session-main premium-workout-card"><div className="session-head premium-session-head"><div><span className="pill"><Flame size={15}/>Aktivt premium-pass</span><h2>{session.name}</h2><p>Övning {activeIndex+1} av {session.exercises.length} · {done}/{total} set klara · startade för {elapsedMinutes} min sedan</p></div><button className="p4-primary finish-workout" disabled={!done} onClick={finishSession}><Check size={17}/>Avsluta pass</button></div><div className="workout-progress-strip" aria-label="Passprogress"><div><strong>{done}</strong><span>klara set</span></div><div><strong>{remaining}</strong><span>kvarvarande set</span></div><div><strong>{session.exercises.length-activeIndex-1}</strong><span>övningar kvar</span></div><div><strong>{eta}</strong><span>klar cirka</span></div><div className="progress-track"><i style={{width:`${Math.round(done/total*100)}%`}}/></div></div><div className="exercise-pills">{session.exercises.map((e,i)=><button key={e.id} className={`${i===activeIndex?'active':''} ${e.sets.every(s=>s.done)?'complete':''}`} onClick={()=>setActiveIndex(i)} aria-label={`Gå till ${e.name}`}>{i+1}<small>{e.name}</small></button>)}</div><article className="exercise-card-premium"><div className="active-exercise-visual"><AtlasAsset src={active.image} alt={`${active.name} övningsbild`} ratio="16 / 7" fallback={assetFallbackLabels.exercise}/></div><div className="exercise-title-row"><div><span className="eyebrow">{active.muscle} · målmuskel</span><h3>{active.name}</h3><p>Förra passet: {previousPerformance(active.id)}</p></div><div className="exercise-completion"><ProgressRing value={Math.round(activeDone/active.sets.length*100)} label="övning" size={92}/></div></div><details className="session-details-drawer"><summary>Visa teknik, historik och muskelbelastning</summary><div className="exercise-insights"><div><span>Utrustning</span><strong>{active.equipment}</strong></div><div><span>Previous best</span><strong>{previousPerformance(active.id)}</strong></div><div><span>Suggested weight</span><strong>{progressionSuggestion(active.id)}</strong></div><div><span>PR indicator</span><strong className={active.sets.some(s=>s.done&&s.rpe>=9)?'pr-hot':''}>{active.sets.some(s=>s.done&&s.rpe>=9)?'PR-tempo':'Ingen PR än'}</strong></div><div><span>Tekniktips</span><strong>{techniqueTip(active.id)}</strong></div><div><span>Notes</span><strong>{workoutIntelligence.notes}</strong></div></div></details><div className="quick-log-actions"><button onClick={repeatLast}><Copy size={15}/>Repeat last</button><button onClick={()=>quickWeight(2.5)}>+2.5 kg</button><button onClick={()=>quickWeight(5)}>+5 kg</button><button onClick={addSet}><Plus size={15}/>Add set</button><button onClick={skipExercise}><SkipForward size={15}/>Skip exercise</button></div><div className="set-log premium-set-log"><div className="set-row head"><span>Set</span><span>Vikt</span><span>Reps</span><span>RPE</span><span>Tempo</span><span>Klar</span></div>{active.sets.map((s,i)=><div className={`set-row premium ${s.done?'done':''}`} key={s.id}><b>{i+1}</b><input aria-label={`Vikt set ${i+1}`} inputMode="decimal" type="number" value={s.kg} onChange={e=>updateSet(i,{kg:Number(e.target.value)})}/><input aria-label={`Reps set ${i+1}`} inputMode="numeric" type="number" value={s.reps} onChange={e=>updateSet(i,{reps:Number(e.target.value)})}/><select aria-label={`RPE set ${i+1}`} value={s.rpe} onChange={e=>updateSet(i,{rpe:Number(e.target.value)})}>{[6,7,8,9,10].map(v=><option key={v}>{v}</option>)}</select><input aria-label={`Tempo och notering set ${i+1}`} value={s.tempo||s.notes||''} placeholder="3-1-1 / notes" onChange={e=>updateSet(i,{tempo:e.target.value,notes:e.target.value})}/><button className="set-done-button" onClick={()=>toggleDone(i,s)}>{s.done?<Check size={21}/>:<span/>}</button><button className="set-delete-button" aria-label={`Ta bort set ${i+1}`} onClick={()=>deleteSet(i)}><Trash2 size={15}/></button></div>)}</div></article><div className="session-nav premium-session-nav"><button className="p4-secondary" disabled={activeIndex===0} onClick={()=>setActiveIndex(i=>i-1)}>Föregående</button><button className="p4-primary" disabled={activeIndex===session.exercises.length-1} onClick={()=>setActiveIndex(i=>i+1)}>Nästa övning</button></div></section><aside className="panel session-side premium-session-side"><div className="live-progress-head"><SectionTitle eyebrow="Live" title="Workout progress"/><ProgressRing value={Math.round(done/total*100)} label="klart" size={92}/></div><MuscleVolume live={load}/><div className="recovery-live"><HeartPulse size={22}/><span><strong>Belastning sparas direkt</strong><small>Kroppskartan uppdateras utan extra steg.</small></span></div></aside><div className="floating-rest-timer" role="timer" aria-live="polite"><Clock size={18}/><strong>{Math.floor(restSeconds/60)}:{String(restSeconds%60).padStart(2,'0')}</strong><button onClick={()=>setRestPaused(v=>!v)}><Pause size={15}/>{restPaused?'Fortsätt':'Pausa'}</button><button onClick={()=>setRestSeconds(0)}><SkipForward size={15}/>Skip</button><button onClick={()=>setRestSeconds(v=>v+30)}>+30 sek</button><button className={autoRest?'active':''} onClick={()=>setAutoRest(v=>!v)}>Auto</button></div></div>
}
const previousPerformance=id=>({bench:'75 × 8, 8, 7',row:'70 × 10, 9, 9',squat:'85 × 6, 6, 5'}[id]||'Stabil prestation')
const progressionSuggestion=id=>({bench:'77,5 kg × 6–8',row:'72,5 kg × 8–10',squat:'87,5 kg × 5–7'}[id]||'Behåll vikt och lägg till 1 repetition')
const techniqueTip=id=>({bench:'Skulderbladen bak och ned, pausa lätt mot bröstet innan press.',row:'Starta draget med skulderbladet och håll bröstet högt.',squat:'Tryck knäna i tålinjen och behåll tryck över hela foten.',pulldown:'Dra armbågarna ned mot fickorna utan att luta bak för mycket.',ohp:'Spänn sätet och låt huvudet komma igenom när vikten passerar pannan.'}[id]||'Håll kontrollerad excentrisk fas och lämna 1–2 reps i reserv.')

function MuscleVolume({compact=false,live={}}){
  const defaults={Bröst:12,Rygg:16,Axlar:10,Triceps:9,Biceps:8,Ben:14,Säte:9,Bål:6,Vader:5};const data=Object.keys(live).length?live:defaults
  return <div className={`muscle-volume ${compact?'compact':''}`}>{Object.entries(data).map(([m,v])=><div key={m}><span>{m}</span><div><i style={{width:`${Math.min(100,(v/18)*100)}%`}}/></div><b>{Number(v).toFixed(Number(v)%1?1:0)} set</b></div>)}</div>
}

function WorkoutLanding({programs,startProgram}){const today=programs.find(p=>p.id==='upper-a')||programs[0];const exercises=today.exercises.map(id=>exerciseBank.find(e=>e.id===id)).filter(Boolean);const targetMuscles=[...new Set(exercises.map(e=>e.muscle))].slice(0,4).join(' · ');const estimatedSets=exercises.reduce((sum,e)=>sum+Number((e.sets.match(/\d+/)||[3])[0]),0);return <div className="p4-grid workout-overview"><Card className="span8 atlas-hero-mobile workout-overview-hero"><span className="pill"><Dumbbell size={15}/>Dagens workout</span><h2>{today.name}</h2><p>En fokuserad pre-workout dashboard med allt beslutstöd samlat före första setet.</p><div className="overview-meta premium-dashboard-meta"><span><Clock size={14}/>55 min</span><span><Flame size={14}/>{workoutIntelligence.difficulty}</span><span><Target size={14}/>{targetMuscles}</span><span><HeartPulse size={14}/>{workoutIntelligence.recoveryStatus}</span></div><button className="p4-primary start-workout-large" onClick={()=>startProgram(today)}><Play size={19}/>START</button></Card><StatCard icon={Clock} label="Estimated duration" value="55 min" note="inkl. vila"/><StatCard icon={Flame} label="Difficulty" value={workoutIntelligence.difficulty} note="RPE 7–8"/><StatCard icon={Target} label="Expected volume" value={`${workoutIntelligence.expectedVolume.toLocaleString('sv-SE')} kg`} note={`${estimatedSets} arbetsset`}/><StatCard icon={HeartPulse} label="Recovery status" value="82%" note="existing readiness data"/><section className="panel span5"><SectionTitle eyebrow="Senaste pass" title="Previous workout summary"/><div className="summary-callout"><History size={20}/><strong>{workoutIntelligence.previousSummary}</strong><span>Repetera vinnande ordning och höj bara där kvaliteten känns hög.</span></div></section><section className="panel span7"><SectionTitle eyebrow="Dagens pass" title="Target muscles & övningar"/><div className="atlas-card-stack compact">{exercises.slice(0,5).map((e,i)=><div className="landing-exercise" key={e.id}><b>{i+1}</b><span><strong>{e.name}</strong><small>{e.muscle} · {e.equipment} · {e.sets}</small></span><ChevronRight size={17}/></div>)}</div></section></div>}

function FoodView({notify}){return <div className="p4-grid"><Card className="span8 atlas-hero-mobile food-glow"><span className="pill"><Apple size={15}/>Nutrition</span><h2>1 420 / 2 050 kcal</h2><p>Premium food-vy med tydlig makrobalans och snabb loggning utan ny affärslogik.</p><ActionButton onClick={()=>notify('Måltid redo att loggas')}><Plus size={17}/>Logga måltid</ActionButton></Card><Card className="span4 center-card"><ProgressRing value={69} label="kcal"/></Card>{[['Protein','132 / 170 g',78],['Kolhydrater','146 / 210 g',70],['Fett','48 / 68 g',71]].map(m=><Card key={m[0]} className="span4 macro-premium"><span>{m[0]}</span><strong>{m[1]}</strong><div className="progress-track"><i style={{width:`${m[2]}%`}}/></div></Card>)}<Card className="span12"><AtlasSectionTitle eyebrow="Dagens logg" title="Måltider" action="Visa allt"/><div className="premium-list">{['Frukost · Yoghurt och bär · 410 kcal','Lunch · Kyckling och ris · 620 kcal','Mellanmål · Whey och banan · 390 kcal'].map(x=><div key={x}>{x}</div>)}</div></Card></div>}

const recoveryMetrics=[
  {icon:Moon,label:'Sleep quality',value:'88%',note:'7 h 24 m · steady rhythm',tone:'positive'},
  {icon:HeartPulse,label:'Resting heart rate',value:'52 bpm',note:'4 below baseline',tone:'positive'},
  {icon:Activity,label:'Training load',value:'68%',note:'Optimal adaptation zone'},
  {icon:Waves,label:'Stress balance',value:'Low',note:'Breathing trend stable',tone:'positive'}
]

const recoveryTimeline=[['Now',82],['+6h',85],['+12h',88],['+24h',92],['+36h',95]]

function RecoveryView(){return <div className="p4-grid recovery-page"><Card className="span8 atlas-hero-mobile recovery-glow recovery-hero"><span className="pill"><Moon size={15}/>Recovery command center</span><h2>Återhämtning 82%</h2><p>En lugn OLED-vy från Recovery-konceptet: readiness, sömn, puls och lokal belastning samlas till ett tydligt beslut inför nästa pass.</p><div className="recovery-pills"><span>7 h 24 m sleep</span><span>52 bpm resting HR</span><span>Low stress</span><span>Next hard session: tomorrow</span></div></Card><Card className="span4 center-card recovery-score-card"><ProgressRing value={82} label="ready"/><strong>Green light</strong><span>Keep 1–2 reps in reserve on heavy presses.</span></Card>{recoveryMetrics.map(metric=><StatCard key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} note={metric.note} tone={metric.tone}/>) }<section className="panel span7 recovery-plan"><SectionTitle eyebrow="Next 36 hours" title="Recovery forecast"/><div className="recovery-timeline-premium">{recoveryTimeline.map(([label,value])=><div key={label}><span>{label}</span><div><i style={{height:`${value}%`}}/></div><b>{value}</b></div>)}</div><p><Sparkles size={16}/>ATLAS recommends mobility today and normal upper-body volume once readiness passes 88%.</p></section><section className="panel span5 recovery-plan"><SectionTitle eyebrow="Muscle readiness" title="Local load map"/><div className="recovery-muscle-list">{[['Chest','Ready','86%'],['Back','Ready','84%'],['Shoulders','Moderate','71%'],['Lower back','Watch','58%']].map(([muscle,state,value])=><div key={muscle}><span><strong>{muscle}</strong><small>{state}</small></span><b>{value}</b></div>)}</div></section></div>}

function CoachView({notify}){return <div className="coach-premium"><div className="coach-orb"><Bot size={42}/></div><span className="pill"><Sparkles size={15}/>Coach</span><h2>Vad vill du optimera idag?</h2><p>UI-only coachpanel som återanvänder befintliga notifieringar och inte introducerar en ny AI-motor.</p><div className="prompt-grid">{['Hur bör jag träna idag?','Vad säger min återhämtning?','Justera veckans plan'].map(q=><button key={q} onClick={()=>notify('Coach-fråga vald')}><Sparkles size={18}/><span>{q}</span><ChevronRight size={18}/></button>)}</div></div>}

function CalendarView({history}){
  const days=Array.from({length:31},(_,i)=>i+1);const trained=new Set(history.map(h=>Number(h.date.slice(-2))))
  return <div className="p4-grid"><section className="panel span8"><SectionTitle eyebrow="Juli 2026" title="Träningskalender"/><div className="calendar-grid">{['M','T','O','T','F','L','S'].map((d,i)=><b key={i}>{d}</b>)}{days.map(d=><button key={d} className={trained.has(d)?'trained':''}><span>{d}</span>{trained.has(d)&&<i/>}</button>)}</div></section><section className="panel span4"><SectionTitle eyebrow="Kontinuitet" title="Denna månad"/><div className="calendar-kpis"><KpiMini value="12" label="Pass"/><KpiMini value="82%" label="Följsamhet"/><KpiMini value="4" label="Veckor i rad"/></div></section></div>
}

function HistoryView({history,completedWorkout}){const [q,setQ]=useState('');const filtered=history.filter(h=>(h.name+h.gym+h.date).toLowerCase().includes(q.toLowerCase()));return <div className="completion-layout">{completedWorkout&&<section className="panel completion-celebration"><div className="celebration-orb"><Trophy size={46}/></div><span className="pill"><Sparkles size={15}/>Workout complete</span><h2>Snyggt jobbat.</h2><p>{completedWorkout.name} är sparat med en komplett premiumsummering och nästa rekommendation.</p><div className="completion-stats"><div><strong>{completedWorkout.duration} min</strong><span>Duration</span></div><div><strong>{completedWorkout.volume.toLocaleString('sv-SE')} kg</strong><span>Volume</span></div><div><strong>{completedWorkout.sets}</strong><span>Total sets</span></div><div><strong>{completedWorkout.prs}</strong><span>Personal records</span></div><div><strong>{completedWorkout.calories}</strong><span>Calories</span></div><div><strong>{completedWorkout.recovery}</strong><span>Recovery estimate</span></div><div><strong>{workoutIntelligence.nextWorkout}</strong><span>Suggested next workout</span></div></div></section>}<section className="panel"><div className="history-toolbar"><SectionTitle eyebrow="Alla pass" title="Träningshistorik"/><div className="search-box small"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filtrera historik"/></div></div><div className="history-table"><div className="history-row head"><span>Datum</span><span>Pass</span><span>Gym</span><span>Set</span><span>Volym</span><span>Tid</span></div>{filtered.map(h=><div className="history-row" key={h.id}><span>{h.date}</span><strong>{h.name}</strong><span>{h.gym}</span><span>{h.sets}</span><span>{h.volume.toLocaleString('sv-SE')} kg</span><span>{h.duration} min</span></div>)}</div></section></div>}

function StatsView({history}){const volume=history.reduce((s,h)=>s+h.volume,0);return <div className="p4-grid"><Kpi icon={Dumbbell} label="Totalt antal pass" value={history.length}/><Kpi icon={Flame} label="Total volym" value={`${Math.round(volume/1000)} ton`}/><Kpi icon={Trophy} label="Personbästa" value="11"/><Kpi icon={Activity} label="Träningsdagar" value="18"/><section className="panel span7"><SectionTitle eyebrow="8 veckor" title="Volymutveckling"/><div className="bar-chart">{[42,48,55,51,63,68,74,82].map((h,i)=><div key={i}><span style={{height:`${h}%`}}/><small>V{i+1}</small></div>)}</div></section><section className="panel span5"><SectionTitle eyebrow="Balans" title="Muskelgrupper"/><MuscleVolume compact/></section><section className="panel span12"><SectionTitle eyebrow="Smart progression" title="Nästa rekommenderade höjningar"/><div className="recommendations">{[['Bänkpress','75 → 77,5 kg','Två pass inom målreps'],['Sittande rodd','70 → 72,5 kg','RPE under 8,5'],['Benpress','150 → 155 kg','Alla set genomförda']].map(r=><div key={r[0]}><Sparkles size={20}/><span><strong>{r[0]}</strong><small>{r[2]}</small></span><b>{r[1]}</b><button>Acceptera</button></div>)}</div></section></div>}

function NewProgramModal({onClose,onCreate}){const [name,setName]=useState('Mitt program');const [type,setType]=useState('Eget');return <div className="modal-backdrop"><div className="p4-modal"><button className="modal-x" onClick={onClose}><X size={18}/></button><Dumbbell size={36}/><h2>Nytt träningsprogram</h2><label>Namn<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Upplägg<select value={type} onChange={e=>setType(e.target.value)}>{['Eget','Upper/Lower','Push Pull Legs','Helkropp','Bro Split'].map(x=><option key={x}>{x}</option>)}</select></label><button className="p4-primary full" onClick={()=>onCreate({id:`custom-${Date.now()}`,name,type,days:3,favorite:false,archived:false,exercises:['bench','row','squat']})}>Skapa program</button></div></div>}

function ShareModal({programs,onClose,notify}){const [selected,setSelected]=useState(programs[0]?.id);const program=programs.find(p=>p.id===selected);const code=`ATLAS-${program?.id?.toUpperCase()||'PROGRAM'}`;const copy=()=>{navigator.clipboard?.writeText(code);notify('Delningskod kopierad')};return <div className="modal-backdrop"><div className="p4-modal share-modal"><button className="modal-x" onClick={onClose}><X size={18}/></button><QrCode size={38}/><h2>Dela träningsprogram</h2><select value={selected} onChange={e=>setSelected(e.target.value)}>{programs.filter(p=>!p.archived).map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select><div className="fake-qr">{Array.from({length:49},(_,i)=><i key={i} className={(i*7+i%5)%3===0?'on':''}/>)}</div><code>{code}</code><button className="p4-primary full" onClick={copy}><Copy size={17}/>Kopiera delningskod</button></div></div>}

function Kpi({icon:Icon,label,value}){return <article className="p4-kpi span3"><Icon size={20}/><span>{label}</span><strong>{value}</strong></article>}
function KpiMini({value,label}){return <div><strong>{value}</strong><span>{label}</span></div>}
function SectionTitle({eyebrow,title}){return <div className="section-title"><span>{eyebrow}</span><h3>{title}</h3></div>}
