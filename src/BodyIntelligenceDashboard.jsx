import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ChevronDown, RotateCcw, Sparkles, X } from 'lucide-react'
import { bodyMuscles, buildBodyDashboardModel, getBodyHighlightState, sortVolumeSummary } from './bodyIntelligenceModel.js'

const statusLabels = { ready: 'Redo', recovering: 'Återhämtar', fatigued: 'Trött', priority: 'Prioritet' }
const trendLabels = { improving: '↑ förbättras', stable: '→ stabil', declining: '↓ minskar' }
const numberLabel = value => Number(value || 0).toLocaleString('sv-SE')

export default memo(function BodyIntelligenceDashboard({ workouts, liveSession, exerciseLibrary, goal, onNavigateToWorkout }) {
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState('front')
  const [sort, setSort] = useState('highest')
  const [legendOpen, setLegendOpen] = useState(false)
  const closeRef = useRef(null)
  const model = useMemo(() => buildBodyDashboardModel({ workouts, liveSession, exerciseLibrary, goal, trainingStreak: workouts.length, restDays: Math.max(0, 7 - workouts.length) }), [workouts, liveSession, exerciseLibrary, goal])
  const selected = model.muscles.find(muscle => muscle.id === selectedId)
  const volume = useMemo(() => sortVolumeSummary(model.muscles, sort), [model.muscles, sort])

  useEffect(() => { if (selected) closeRef.current?.focus() }, [selected])
  useEffect(() => {
    if (!selected) return undefined
    const onKey = event => event.key === 'Escape' && setSelectedId(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  return <div className="body-intelligence-dashboard">
    <section className="body-focus" aria-label="Dagens fokus"><span>Dagens fokus</span><strong>{model.focus}</strong></section>
    <section className="panel body-hero-panel">
      <div className="body-toolbar"><div><span className="eyebrow">Recovery command center · Body Intelligence</span><h2>Vad kan jag träna idag?</h2></div><button type="button" className="body-view-toggle" onClick={() => setView(value => value === 'front' ? 'back' : 'front')}><RotateCcw size={17}/>{view === 'front' ? 'Framsida' : 'Baksida'}</button></div>
      <div className="body-map" aria-label={`${view === 'front' ? 'Framsida' : 'Baksida'} interaktiv muskelkarta`}>
        <BodySilhouette view={view}/>
        {model.muscles.filter(muscle => muscle.view === view).map((muscle, index) => <button type="button" key={muscle.id} className={`body-muscle-pin pin-${index + 1} ${muscle.status} ${getBodyHighlightState(muscle.id, selectedId, model.focusMuscles)}`} onClick={() => setSelectedId(muscle.id)} aria-label={`${muscle.name}, ${statusLabels[muscle.status]}, ${muscle.recoveryPercentage} procent återhämtad`}><span>{muscle.name}</span><b>{muscle.recoveryPercentage}%</b></button>)}
      </div>
      <div className="body-legend"><button type="button" aria-expanded={legendOpen} onClick={() => setLegendOpen(value => !value)}>Teckenförklaring <ChevronDown size={16}/></button>{legendOpen && <div>{Object.entries(statusLabels).map(([id, label]) => <span key={id}><i className={id}/>{label}</span>)}</div>}</div>
    </section>
    <button type="button" className="panel body-coach-card" onClick={() => { setView(model.focusMuscles.some(id => bodyMuscles[id]?.view === 'back') ? 'back' : 'front'); setSelectedId(model.focusMuscles[0] || null) }}><Sparkles size={20}/><span><small>ASKR Coach</small><strong>{model.coach.message}</strong><em>Tryck för att markera på kroppen</em></span></button>
    <section className="panel recovery-summary"><header><span className="eyebrow">Recovery forecast · Muscle readiness</span><strong>{model.recovery.readiness}% redo</strong></header><div>{[['Recovery score',`${model.recovery.recoveryScore}%`],['Fatigue',`${model.recovery.fatigueScore}%`],['Intensitet',model.recovery.intensity],['Passlängd',`${model.recovery.duration} min`],['Träningssvit',`${model.recovery.trainingStreak} pass`],['Vilodagar',model.recovery.restDays]].map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div></section>
    <section className="panel weekly-volume"><header><div><span className="eyebrow">Den här veckan</span><h3>Veckovolym</h3></div><select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sortera veckovolym"><option value="highest">Högst volym</option><option value="lowest">Lägst volym</option><option value="alphabetical">Alfabetiskt</option></select></header>{!model.hasHistory && <p className="body-empty">Ingen historik ännu. Alla muskler börjar på 0 set.</p>}<div>{volume.map(muscle => <button type="button" key={muscle.id} onClick={() => { setView(muscle.view); setSelectedId(muscle.id) }}><span><strong>{muscle.name}</strong><small>{statusLabels[muscle.status]} · {muscle.trainingZone === 'productive' ? 'balanserad' : muscle.trainingZone}</small></span><b>{Math.round(muscle.effectiveSets)} set</b></button>)}</div></section>
    {selected && <div className="body-sheet-backdrop" onMouseDown={event => event.target === event.currentTarget && setSelectedId(null)}><section className="body-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="muscle-sheet-title"><button ref={closeRef} type="button" className="body-sheet-close" onClick={() => setSelectedId(null)} aria-label="Stäng muskeldetaljer"><X/></button><header><span className="eyebrow">Muscle intelligence</span><h2 id="muscle-sheet-title">{selected.name}</h2><span className={`body-status ${selected.status}`}>{statusLabels[selected.status]}</span></header><div className="body-sheet-score"><strong>{selected.recoveryPercentage}%</strong><span>återhämtad</span></div><dl>{[['Volym denna vecka',`${Math.round(selected.effectiveSets)} set`],['MEV / MAV / MRV',`${selected.thresholds.mev} / ${selected.thresholds.mav} / ${selected.thresholds.mrv}`],['Rekommenderade set kvar',selected.setsRemaining],['Senast tränad',selected.lastTrainedLabel],['Full återhämtning',selected.fullRecoveryLabel],['Primär utrustning',selected.equipment]].map(([term, detail]) => <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>)}</dl><MuscleHistoryDetail muscle={selected} coach={model.coach}/></section></div>}
  </div>
})


function BodySilhouette({ view }) {
  return <svg className="body-silhouette" viewBox="0 0 180 500" aria-hidden="true">
    <circle className="body-silhouette-head" cx="90" cy="29" r="22"/>
    <path className="body-silhouette-form" d="M67 57C54 61 45 69 40 82L21 158c-3 12-5 26-4 39l2 69c0 8 5 13 11 13 7 0 11-5 12-13l4-67 12-51 3 88-10 92 7 149c1 10 7 16 15 16 9 0 14-6 15-16l2-120 2-31 2 31 2 120c1 10 6 16 15 16 8 0 14-6 15-16l7-149-10-92 3-88 12 51 4 67c1 8 5 13 12 13 6 0 11-5 11-13l2-69c1-13-1-27-4-39l-19-76c-5-13-14-21-27-25l-17-5H84l-17 5Z"/>
    <path className="body-silhouette-center" d="M90 65v263M62 151c17 8 39 8 56 0M57 236c21 11 45 11 66 0M58 328c10 5 20 8 30 8M122 328c-10 5-20 8-30 8"/>
    {view === 'front' ? <g className="body-silhouette-details">
      <path d="M63 91c8-7 17-10 27-10s19 3 27 10M62 100c6 23 14 36 28 39 14-3 22-16 28-39M72 157c3 15 9 25 18 30 9-5 15-15 18-30M76 202h28M73 225h34M69 342c6 4 12 6 19 6M111 342c-6 4-12 6-19 6"/>
    </g> : <g className="body-silhouette-details">
      <path d="M66 86c8 10 16 15 24 15s16-5 24-15M60 108c9 6 19 10 30 10s21-4 30-10M64 127c6 23 14 38 26 45 12-7 20-22 26-45M68 198c7 7 14 11 22 11s15-4 22-11M69 342c6 4 12 6 19 6M111 342c-6 4-12 6-19 6"/>
    </g>}
  </svg>
}

function MuscleHistoryDetail({ muscle, coach }) {
  const history = muscle.history
  return <div className="muscle-history-detail">
    <section><h3>Senaste övningar</h3>{history.recentExercises.length ? <div className="muscle-history-list">{history.recentExercises.map(exercise => <article key={exercise.id}><span><strong>{exercise.name}</strong><small>{exercise.daysAgo === 0 ? 'Idag' : `${exercise.daysAgo} dagar sedan`}</small></span><b>{exercise.sets} set</b></article>)}</div> : <p className="body-empty">Ingen träningshistorik för muskeln ännu.</p>}</section>
    <section><h3>Progress</h3><div className="muscle-progress-grid">{[['Veckovolym',`${numberLabel(history.weeklyVolume)} kg`],['Månadsvolym',`${numberLabel(history.monthlyVolume)} kg`],['Pass',history.trainingFrequency],['Snittinsats',history.averageIntensity ? `RPE ${history.averageIntensity}` : '—'],['Träningsfrekvens',history.daysSinceLastTrained == null ? 'Ingen data' : `${history.trainingFrequency} pass`],['Veckotrend',trendLabels[history.trend.direction]]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="muscle-record-row">{[['Senaste vikt',`${numberLabel(history.lastWeight)} kg`],['Bästa vikt',`${numberLabel(history.bestWeight)} kg`],['Estimerad 1RM',`${numberLabel(history.bestEstimated1RM)} kg`]].map(([label, value]) => <span key={label}><small>{label}</small><b>{value}</b></span>)}</div></section>
    <section><h3>Övningsbidrag</h3>{history.contributions.length ? <div className="muscle-contribution-list">{history.contributions.slice(0, 5).map(exercise => <div key={exercise.id}><span>{exercise.name}</span><b>{exercise.percentage}%</b><i aria-hidden="true"><em style={{ width: `${exercise.percentage}%` }}/></i></div>)}</div> : <p className="body-empty">Bidrag visas när slutförda set har loggats.</p>}</section>
    <section className="body-sheet-advice"><Sparkles size={18}/><p><strong>Coach Notes</strong>{coach.explanation?.summary} {muscle.coachRecommendation}</p></section>
    <section><h3>Favoritövning</h3><div className="muscle-favorites"><span><small>Mest använd</small><strong>{history.favoriteExercise.mostUsed || 'Ingen data'}</strong></span><span><small>Bäst presterande</small><strong>{history.favoriteExercise.bestPerforming || 'Ingen data'}</strong></span></div></section>
  </div>
}
