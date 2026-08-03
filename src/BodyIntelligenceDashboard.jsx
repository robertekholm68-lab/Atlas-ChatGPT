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
  return <svg className="body-silhouette" viewBox="0 0 220 520" aria-hidden="true">
    <g className="anatomy-base">
      <ellipse cx="110" cy="28" rx="22" ry="27"/>
      <path d="M90 54 68 65 48 84 31 147 20 229 28 233 47 164 60 118 66 220 55 307 63 494 78 494 91 322 106 243h8l15 79 13 172h15l8-187-11-87 6-102 13 46 19 69 8-4-11-82-17-63-20-19-22-11Z"/>
    </g>
    <path className="anatomy-seam" d="M110 55v190M64 220c29 14 63 14 92 0M56 307c35 13 73 13 108 0"/>
    {view === 'front' ? <g className="anatomy-muscles front">
      <path d="M92 55 72 67 87 91l20-8Z"/><path d="m128 55 20 12-15 24-20-8Z"/>
      <path d="M70 69Q50 74 48 98q8 15 22 9l16-17Z"/><path d="M150 69q20 5 22 29-8 15-22 9l-16-17Z"/>
      <path d="M86 91q-18 0-22 16l5 45q19 12 39-6v-51Z"/><path d="M134 91q18 0 22 16l-5 45q-19 12-39-6V95Z"/>
      <path d="m54 106-8 48 8 45 13-13-1-72Z"/><path d="m166 106 8 48-8 45-13-13 1-72Z"/>
      <path d="m46 160-12 65 10 3 15-35Z"/><path d="m174 160 12 65-10 3-15-35Z"/>
      <path d="M78 154q14 8 29 3v29H84Z"/><path d="M142 154q-14 8-29 3v29h23Z"/>
      <path d="M84 190h23v25H81Z"/><path d="M136 190h-23v25h26Z"/>
      <path d="m77 158-9 64 11 6 5-38Z"/><path d="m143 158 9 64-11 6-5-38Z"/>
      <path d="m79 232 25 13-17 70-27-12Z"/><path d="m141 232-25 13 17 70 27-12Z"/>
      <path d="m104 250-13 70 15 92 3-166Z"/><path d="m116 250 13 70-15 92-3-166Z"/>
      <path d="m66 319 20 2-9 92-15-15Z"/><path d="m154 319-20 2 9 92 15-15Z"/>
      <path d="m62 405 15 12-5 73-10-13Z"/><path d="m158 405-15 12 5 73 10-13Z"/>
    </g> : <g className="anatomy-muscles back">
      <path d="M91 55 71 68l21 43 16-27Z"/><path d="m129 55 20 13-21 43-16-27Z"/>
      <path d="M70 69Q50 74 48 98q8 15 22 9l16-17Z"/><path d="M150 69q20 5 22 29-8 15-22 9l-16-17Z"/>
      <path d="m91 91-25 22 12 84 30 34V88Z"/><path d="m129 91 25 22-12 84-30 34V88Z"/>
      <path d="m54 106-8 48 8 45 13-13-1-72Z"/><path d="m166 106 8 48-8 45-13-13 1-72Z"/>
      <path d="m46 160-12 65 10 3 15-35Z"/><path d="m174 160 12 65-10 3-15-35Z"/>
      <path d="M67 220q20 7 39 16l-2 61q-27 4-43-12Z"/><path d="M153 220q-20 7-39 16l2 61q27 4 43-12Z"/>
      <path d="m65 302 39 2-14 109-27-17Z"/><path d="m155 302-39 2 14 109 27-17Z"/>
      <path d="m63 405 27 14-14 69-14-11Z"/><path d="m157 405-27 14 14 69 14-11Z"/>
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
