import { useMemo, useState } from 'react'
import { ArrowRight, Award, Check, ChevronRight, Clock, Dumbbell, Edit3, Flame, Heart, History, Plus, Search, Sparkles, Star, Timer, Trash2, X, Zap } from 'lucide-react'
import { activeWorkout, exerciseLibrary, muscles } from './workoutData'

const equipmentFilters = ['Machine','Cable','Barbell','Dumbbell','Bodyweight']
const difficultyFilters = ['Beginner','Intermediate','Advanced']
const typeFilters = ['Compound','Isolation']

export default function WorkoutPlatform({ notify }) {
  const [mode, setMode] = useState('active')
  const [selectedId, setSelectedId] = useState('bench-press')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ muscle:'All', equipment:'All', difficulty:'All', type:'All', favorites:false, recent:false, custom:false })
  const [workout, setWorkout] = useState(activeWorkout)
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const selectedExercise = exerciseLibrary.find(ex => ex.id === selectedId) || exerciseLibrary[0]
  const openDetail = id => { setSelectedId(id); setMode('detail') }
  const complete = () => { setMode('summary'); notify('Workout completed — premium summary ready') }
  return <div className="workout-platform">
    <div className="workout-tabs" role="tablist" aria-label="Workout platform sections">
      {['active','browser','detail','summary'].map(tab => <button key={tab} role="tab" aria-selected={mode===tab} className={mode===tab?'active':''} onClick={()=>setMode(tab)}>{tab}</button>)}
    </div>
    {mode === 'active' && <ActiveWorkout workout={workout} setWorkout={setWorkout} exerciseIndex={exerciseIndex} setExerciseIndex={setExerciseIndex} onDetail={openDetail} onComplete={complete} notify={notify}/>} 
    {mode === 'browser' && <ExerciseBrowser query={query} setQuery={setQuery} filters={filters} setFilters={setFilters} onDetail={openDetail}/>} 
    {mode === 'detail' && <ExerciseDetail exercise={selectedExercise} onStart={()=>{setMode('active'); notify(`${selectedExercise.name} queued`)}}/>}
    {mode === 'summary' && <WorkoutSummary workout={workout} onRestart={()=>setMode('active')}/>} 
  </div>
}

function ActiveWorkout({ workout, setWorkout, exerciseIndex, setExerciseIndex, onDetail, onComplete, notify }) {
  const block = workout.exercises[exerciseIndex]
  const exercise = exerciseLibrary.find(ex => ex.id === block.exerciseId)
  const previous = block.sets.at(-1) || { weight: 90, reps: 6, rpe: 8 }
  const currentSet = block.sets.length + 1
  const progress = Math.round((workout.exercises.reduce((sum, x) => sum + x.sets.length, 0) / workout.exercises.reduce((sum, x) => sum + x.targetSets, 0)) * 100)
  const next = workout.exercises[exerciseIndex+1] && exerciseLibrary.find(ex => ex.id === workout.exercises[exerciseIndex+1].exerciseId)
  const addSet = (delta = 0) => setWorkout(w => ({...w, exercises:w.exercises.map((x,i)=> i===exerciseIndex ? {...x, sets:[...x.sets, { weight: previous.weight + delta, reps: previous.reps, rpe: previous.rpe }]} : x)}))
  const deleteSet = () => setWorkout(w => ({...w, exercises:w.exercises.map((x,i)=> i===exerciseIndex ? {...x, sets:x.sets.slice(0,-1)} : x)}))
  const skip = () => setExerciseIndex(i => Math.min(i + 1, workout.exercises.length - 1))
  return <div className="active-workout-grid">
    <section className="exercise-command-card">
      <div className="asset-frame hero"><span>{exercise.hero}</span><small>hero image slot</small></div>
      <div className="exercise-command-copy">
        <span className="status-pill"><Zap size={15}/> Active workout</span>
        <h2>{exercise.name}</h2>
        <p>{exercise.pattern} · {exercise.equipment} · {exercise.type}</p>
        <div className="progress-track"><span style={{width:`${progress}%`}} /></div>
        <small>{progress}% complete · set {currentSet} of {block.targetSets}</small>
      </div>
      <button className="icon-button" aria-label="Open exercise detail" onClick={()=>onDetail(exercise.id)}><ChevronRight size={20}/></button>
    </section>
    <section className="log-card">
      <SetStat label="Previous" value={`${previous.weight} kg × ${previous.reps}`} note={`RPE ${previous.rpe}`}/>
      <SetStat label="Weight" value={`${previous.weight} kg`} note="repeat ready"/>
      <SetStat label="Reps" value={previous.reps} note="target"/>
      <SetStat label="RPE" value={previous.rpe} note="effort"/>
      <div className="quick-actions">
        <button onClick={()=>addSet(0)}><Check size={18}/> Repeat</button><button onClick={()=>addSet(2.5)}>+2.5</button><button onClick={()=>addSet(5)}>+5</button><button><Edit3 size={17}/> Edit</button>
      </div>
      <div className="secondary-actions"><button onClick={deleteSet}><Trash2 size={16}/> Delete set</button><button onClick={()=>addSet(0)}><Plus size={16}/> Add set</button><button onClick={skip}><X size={16}/> Skip exercise</button></div>
    </section>
    <section className="rest-card"><Timer size={22}/><strong>{Math.floor(block.rest/60)}:{String(block.rest%60).padStart(2,'0')}</strong><span>Rest timer · tempo {block.tempo}</span><button onClick={()=>notify('Rest adjusted')}>+30 sec</button></section>
    <section className="muscle-session-card"><MusclePreview primary={exercise.primary} secondary={exercise.secondary}/><div><h3>Muscles</h3><p>Primary: {exercise.primary.map(id=>muscles[id]?.name).join(', ')}</p><p>Secondary: {exercise.secondary.map(id=>muscles[id]?.name).join(', ') || 'None'}</p></div></section>
    <section className="notes-card"><label>Exercise notes<textarea defaultValue={exercise.notes} /></label><label>Tempo<input defaultValue={block.tempo}/></label><label>Rest<input defaultValue={`${block.rest}s`}/></label></section>
    <section className="next-card"><span>Next exercise</span><strong>{next?.name || 'Workout summary'}</strong><p>{next ? `${next.primary.map(id=>muscles[id]?.name).join(', ')} · ${next.equipment}` : 'Review volume, PRs, fatigue and coach-ready signals.'}</p></section>
    <div className="sticky-workout-actions"><button className="text-button" onClick={skip}>Skip</button><button className="primary-button" onClick={exerciseIndex === workout.exercises.length - 1 ? onComplete : () => setExerciseIndex(i=>i+1)}><Dumbbell size={18}/>{exerciseIndex === workout.exercises.length - 1 ? 'Finish workout' : 'Next exercise'}</button></div>
  </div>
}
function SetStat({label,value,note}){return <div className="set-stat"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}

function ExerciseBrowser({ query, setQuery, filters, setFilters, onDetail }) {
  const allMuscles = ['All', ...Object.values(muscles).map(m => m.name)]
  const list = useMemo(()=>exerciseLibrary.filter(ex => {
    const muscleNames = [...ex.primary, ...ex.secondary].map(id => muscles[id]?.name)
    return ex.name.toLowerCase().includes(query.toLowerCase()) && (filters.muscle==='All'||muscleNames.includes(filters.muscle)) && (filters.equipment==='All'||ex.equipment===filters.equipment) && (filters.difficulty==='All'||ex.difficulty===filters.difficulty) && (filters.type==='All'||ex.type===filters.type) && (!filters.favorites||ex.favorite) && (!filters.recent||ex.recent) && (!filters.custom||ex.custom)
  }), [query, filters])
  return <div className="browser-layout"><div className="browser-search"><Search size={19}/><input aria-label="Search exercises" placeholder="Search exercises" value={query} onChange={e=>setQuery(e.target.value)}/></div><FilterRail title="Muscle" options={allMuscles} value={filters.muscle} set={v=>setFilters({...filters,muscle:v})}/><FilterRail title="Equipment" options={['All',...equipmentFilters]} value={filters.equipment} set={v=>setFilters({...filters,equipment:v})}/><FilterRail title="Difficulty" options={['All',...difficultyFilters]} value={filters.difficulty} set={v=>setFilters({...filters,difficulty:v})}/><FilterRail title="Type" options={['All',...typeFilters]} value={filters.type} set={v=>setFilters({...filters,type:v})}/><div className="smart-filters">{['favorites','recent','custom'].map(id=><button key={id} className={filters[id]?'active':''} onClick={()=>setFilters({...filters,[id]:!filters[id]})}>{id}</button>)}</div><div className="exercise-browser-grid">{list.map(ex=><button key={ex.id} className="exercise-card" onClick={()=>onDetail(ex.id)}><div className="asset-frame thumb"><span>{ex.thumbnail}</span></div><div><strong>{ex.name}</strong><small>{ex.equipment} · {ex.type}</small><p>{ex.primary.map(id=>muscles[id]?.name).join(', ')}</p></div>{ex.favorite&&<Star size={17} fill="currentColor"/>}</button>)}</div>{!list.length&&<div className="empty-state"><Sparkles size={30}/><strong>No exercises found</strong><p>Try clearing a filter or search term.</p></div>}</div>
}
function FilterRail({title, options, value, set}){return <section className="filter-rail" aria-label={title}><span>{title}</span>{options.map(option=><button key={option} className={value===option?'active':''} onClick={()=>set(option)}>{option}</button>)}</section>}

function ExerciseDetail({ exercise, onStart }) { return <div className="detail-layout"><section className="detail-hero"><div className="asset-frame hero"><span>{exercise.hero}</span><small>asset-ready hero</small></div><div><button className="favorite-button"><Heart size={18}/> Favorite</button><h2>{exercise.name}</h2><p>{exercise.pattern} · {exercise.equipment} · {exercise.difficulty}</p><button className="primary-button" onClick={onStart}><Dumbbell size={18}/> Start exercise</button></div></section><section className="media-pair"><div className="asset-frame"><span>START</span><small>{exercise.start}</small></div><div className="asset-frame"><span>END</span><small>{exercise.end}</small></div></section><section className="panel"><h3>Muscle engine</h3><MusclePreview primary={exercise.primary} secondary={exercise.secondary}/></section><InfoList title="Tips" items={exercise.tips}/><InfoList title="Common mistakes" items={exercise.mistakes}/><section className="records-card"><Award/><strong>{exercise.records.weight}</strong><span>Best load</span><strong>{exercise.records.volume}</strong><span>Best volume</span></section><section className="history-card"><History/><h3>Workout & volume history</h3><div className="mini-bars">{exercise.history.map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div><textarea aria-label="Exercise notes" defaultValue={exercise.notes}/></section></div> }
function InfoList({title,items}){return <section className="panel info-list"><h3>{title}</h3>{items.map(item=><p key={item}><Check size={15}/>{item}</p>)}</section>}

function MusclePreview({ primary, secondary }) { const ids = new Set([...primary, ...secondary]); return <div className="muscle-preview" aria-label="Front and back muscle visualization"><Figure view="front" ids={ids} primary={primary}/><Figure view="back" ids={ids} primary={primary}/></div> }
function Figure({view, ids, primary}){return <div><span>{view}</span><svg viewBox="0 0 120 220" role="img"><circle cx="60" cy="20" r="14"/><path d="M44 38h32l12 64-14 16 7 84H67l-7-74-7 74H39l7-84-14-16z"/><path d="M38 44 18 92l-8 52h14l20-70M82 44l20 48 8 52H96L76 74"/><g>{Object.values(muscles).filter(m=>m.view===view&&ids.has(m.id)).map((m,i)=><circle key={m.id} className={primary.includes(m.id)?'primary':'secondary'} cx={38+(i%3)*22} cy={70+Math.floor(i/3)*42} r="12"><title>{m.name}</title></circle>)}</g></svg></div>}

function WorkoutSummary({ workout, onRestart }) { const totalSets = workout.exercises.reduce((s,e)=>s+e.sets.length,0); const volume = workout.exercises.reduce((s,e)=>s+e.sets.reduce((a,b)=>a+b.weight*b.reps,0),0); const trained = [...new Set(workout.exercises.flatMap(w => { const ex = exerciseLibrary.find(e=>e.id===w.exerciseId); return [...ex.primary, ...ex.secondary] }))]; return <div className="summary-layout"><section className="completion-card"><div className="completion-ring"><Check size={42}/></div><span className="status-pill"><Sparkles size={15}/> Workout complete</span><h2>Strong session. Clean volume, focused execution.</h2><p>ATLAS has this ready for future AI Coach review.</p></section><SetStat label="Duration" value="54:18" note="premium flow"/><SetStat label="Volume" value={`${volume.toLocaleString()} kg`} note="total"/><SetStat label="Exercises" value={workout.exercises.length} note="completed"/><SetStat label="Sets" value={totalSets} note="logged"/><SetStat label="PRs" value="2" note="estimated"/><SetStat label="Fatigue" value="Moderate" note="ready in 36h"/><SetStat label="Calories" value="—" note="placeholder"/><section className="panel muscles-trained"><h3>Muscles trained</h3>{trained.map(id=><span key={id}>{muscles[id]?.name}</span>)}</section><button className="primary-button" onClick={onRestart}><ArrowRight size={18}/> Back to workout</button></div> }
