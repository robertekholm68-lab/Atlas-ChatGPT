import { useEffect, useMemo, useState } from 'react'
import { Check, Clock, Dumbbell, Pause, Play, Plus, RotateCcw, Save, Timer, Trash2, X } from 'lucide-react'
import { exerciseLibrary, getExerciseMuscles, muscles } from './workoutData'
import { calculateWorkoutSummary, completeSet, createWorkoutSession, modeKeys, saveCompletedWorkout } from './workoutSessionModel'

function readJson(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback
  try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback }
}
function writeJson(key, value) { if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value)) }
function formatTimer(seconds) { const safe = Math.max(0, Number(seconds) || 0); return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}` }
function fieldValue(value) { return value === undefined || value === null ? '' : value }

export default function WorkoutPlatform({ notify }) {
  const [dataMode, setDataMode] = useState('real')
  const keys = modeKeys(dataMode)
  const [workout, setWorkout] = useState(() => readJson(keys.active, createWorkoutSession({ mode: dataMode })))
  const [history, setHistory] = useState(() => readJson(keys.history, []))
  const [showLibrary, setShowLibrary] = useState(false)

  useEffect(() => { const nextKeys = modeKeys(dataMode); setWorkout(readJson(nextKeys.active, createWorkoutSession({ mode: dataMode }))); setHistory(readJson(nextKeys.history, [])) }, [dataMode])
  useEffect(() => { writeJson(keys.active, workout) }, [keys.active, workout])
  useEffect(() => { writeJson(keys.history, history) }, [keys.history, history])
  useEffect(() => {
    const warn = event => { if (workout.status === 'active') { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [workout.status])

  const activeBlock = workout.exercises[workout.activeExerciseIndex] || workout.exercises[0]
  const activeExercise = exerciseLibrary.find(exercise => exercise.id === activeBlock?.exerciseId) || exerciseLibrary[0]
  const activeSetIndex = Math.max(0, activeBlock?.sets.findIndex(set => !set.completed) ?? 0)
  const activeSet = activeBlock?.sets[activeSetIndex] || activeBlock?.sets.at(-1)
  const previousSet = activeBlock?.sets.slice(0, activeSetIndex).reverse().find(set => set.completed) || null
  const summary = useMemo(() => calculateWorkoutSummary(workout), [workout])

  function updateWorkout(updater) { setWorkout(current => ({ ...updater(current), updatedAt: new Date().toISOString() })) }
  function startWorkout() { updateWorkout(current => ({ ...current, status: 'active', startedAt: current.startedAt || new Date().toISOString() })); notify?.('Workout started') }
  function updateSet(field, value) { updateWorkout(current => ({ ...current, exercises: current.exercises.map((block, index) => index === current.activeExerciseIndex ? { ...block, sets: block.sets.map((set, setIndex) => setIndex === activeSetIndex ? { ...set, [field]: value } : set) } : block) })) }
  function copyPrevious() { if (previousSet) ['weight', 'reps', 'rpe', 'rir'].forEach(field => updateSet(field, previousSet[field] || '')) }
  function markSetComplete() { if (!activeSet) return; setWorkout(current => completeSet(current, current.activeExerciseIndex, activeSetIndex, { weight: activeSet.weight, reps: activeSet.reps, rpe: activeSet.rpe, rir: activeSet.rir }, new Date().toISOString())) }
  function addSet() { updateWorkout(current => ({ ...current, exercises: current.exercises.map((block, index) => index === current.activeExerciseIndex ? { ...block, sets: [...block.sets, { id: `${block.exerciseId}-set-${Date.now()}`, order: block.sets.length, weight: '', reps: '', rpe: '', rir: '', completed: false, completedAt: null, startedAt: null, notes: '', restDuration: block.restDuration, type: 'working' }] } : block) })) }
  function removeSet(setId) { updateWorkout(current => ({ ...current, exercises: current.exercises.map((block, index) => index === current.activeExerciseIndex ? { ...block, sets: block.sets.filter(set => set.id !== setId) } : block) })) }
  function addExercise(exerciseId) { updateWorkout(current => { const exercise = exerciseLibrary.find(ex => ex.id === exerciseId); const restDuration = exercise?.defaultRestDuration || 90; const order = current.exercises.length; return { ...current, exercises: [...current.exercises, { exerciseId, order, targetSets: 3, restDuration, tempo: '', notes: '', sets: Array.from({ length: 3 }, (_, index) => ({ id: `${exerciseId}-set-${Date.now()}-${index}`, order: index, weight: '', reps: '', rpe: '', rir: '', completed: false, completedAt: null, startedAt: null, notes: '', restDuration, type: exercise?.setType || 'working' })) }] } }); setShowLibrary(false) }
  function replaceExercise(exerciseId) { updateWorkout(current => ({ ...current, exercises: current.exercises.map((block, index) => index === current.activeExerciseIndex ? { ...block, exerciseId, restDuration: exerciseLibrary.find(ex => ex.id === exerciseId)?.defaultRestDuration || block.restDuration } : block) })); setShowLibrary(false) }
  function removeExercise() { updateWorkout(current => ({ ...current, activeExerciseIndex: Math.max(0, current.activeExerciseIndex - 1), exercises: current.exercises.filter((_, index) => index !== current.activeExerciseIndex).map((block, order) => ({ ...block, order })) })) }
  function adjustRest(delta) { updateWorkout(current => ({ ...current, restTimer: { ...current.restTimer, secondsRemaining: Math.max(0, current.restTimer.secondsRemaining + delta), duration: Math.max(0, current.restTimer.duration + delta) } })) }
  function finishWorkout() { const result = saveCompletedWorkout(workout, history); setWorkout(result.completed); setHistory(result.history); writeJson(keys.active, result.completed); writeJson(keys.history, result.history); notify?.('Workout saved') }

  const muscleNames = getExerciseMuscles(activeExercise)
  return <div className="gym-mode-shell" data-mode={dataMode}>
    <header className="gym-mode-header"><div><span className="status-pill"><Dumbbell size={15}/> {dataMode === 'real' ? 'Real Mode' : 'Demo Mode'}</span><h2>{workout.name || 'Workout'}</h2><p>{workout.status === 'active' ? 'Active workout is saved locally after every change.' : 'Open today’s workout and start when ready.'}</p></div><select aria-label="Data mode" value={dataMode} onChange={event => setDataMode(event.target.value)}><option value="real">Real Mode</option><option value="demo">Demo Mode</option></select></header>
    <section className="gym-active-card"><div><span>Active exercise</span><h3>{activeExercise.nameSv || activeExercise.name}</h3><p>{activeExercise.nameEn} · {activeExercise.equipment} · {activeExercise.pattern}</p><small>Primary: {muscleNames.primary.map(id => muscles[id]?.name || id).join(', ')}</small></div><strong>Set {activeSetIndex + 1}</strong></section>
    <section className="gym-set-card"><div className="previous-values"><span>Previous set</span><strong>{previousSet ? `${previousSet.weight || 0} kg × ${previousSet.reps || 0}` : 'No previous set'}</strong><button onClick={copyPrevious} disabled={!previousSet}><RotateCcw size={17}/> Copy previous</button></div><label>Weight<input inputMode="decimal" value={fieldValue(activeSet?.weight)} onChange={event => updateSet('weight', event.target.value)} /></label><label>Reps<input inputMode="numeric" value={fieldValue(activeSet?.reps)} onChange={event => updateSet('reps', event.target.value)} /></label><label>RPE/RIR<input inputMode="decimal" value={fieldValue(activeSet?.rpe)} onChange={event => updateSet('rpe', event.target.value)} /></label><button className="primary-button complete-set" onClick={markSetComplete}><Check size={20}/> Complete set</button></section>
    <section className="gym-rest-card"><Timer/><div><span>Rest timer</span><strong>{formatTimer(workout.restTimer.secondsRemaining)}</strong></div><button onClick={() => updateWorkout(c => ({ ...c, restTimer: { ...c.restTimer, running: !c.restTimer.running } }))}>{workout.restTimer.running ? <Pause size={17}/> : <Play size={17}/>} {workout.restTimer.running ? 'Pause' : 'Resume'}</button><button onClick={() => adjustRest(30)}>+30s</button><button onClick={() => adjustRest(-30)}>-30s</button><button onClick={() => updateWorkout(c => ({ ...c, restTimer: { ...c.restTimer, secondsRemaining: 0, running: false } }))}>Skip</button></section>
    <section className="gym-edit-card"><button onClick={addSet}><Plus size={17}/> Add set</button><button onClick={() => activeSet && removeSet(activeSet.id)}><Trash2 size={17}/> Remove set</button><button onClick={() => setShowLibrary(!showLibrary)}><Plus size={17}/> Add / replace exercise</button><button onClick={removeExercise}><X size={17}/> Remove exercise</button>{showLibrary && <div className="gym-library">{exerciseLibrary.map(exercise => <div key={exercise.id}><span>{exercise.nameSv || exercise.name}</span><button onClick={() => addExercise(exercise.id)}>Add</button><button onClick={() => replaceExercise(exercise.id)}>Replace</button></div>)}</div>}</section>
    <section className="gym-summary-strip"><span><Clock size={16}/> {Math.round(summary.durationSeconds / 60)} min</span><span>{summary.exercisesCompleted} exercises</span><span>{summary.setsCompleted} sets</span><span>{summary.totalVolume.toLocaleString()} kg</span><span>{summary.musclesTrained.join(', ') || 'No muscles yet'}</span><span>PRs shown after real history support</span></section>
    <div className="sticky-workout-actions"><button className="text-button" onClick={startWorkout}>Start workout</button><button className="text-button" onClick={() => updateWorkout(current => ({ ...current, activeExerciseIndex: Math.min(current.exercises.length - 1, current.activeExerciseIndex + 1) }))}>Next exercise</button><button className="primary-button" onClick={finishWorkout}><Save size={18}/> Finish & save</button></div>
  </div>
}
