import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ChevronDown, RotateCcw, Sparkles, X } from 'lucide-react'
import { bodyMuscles, buildBodyDashboardModel, getBodyHighlightState, sortVolumeSummary } from './bodyIntelligenceModel.js'

const statusLabels = { ready: 'Redo', recovering: 'Återhämtar', fatigued: 'Trött', priority: 'Prioritet' }

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
        <div className="body-silhouette" aria-hidden="true"><i className="head"/><i className="torso"/><i className="arm left"/><i className="arm right"/><i className="leg left"/><i className="leg right"/></div>
        {model.muscles.filter(muscle => muscle.view === view).map((muscle, index) => <button type="button" key={muscle.id} className={`body-muscle-pin pin-${index + 1} ${muscle.status} ${getBodyHighlightState(muscle.id, selectedId, model.focusMuscles)}`} onClick={() => setSelectedId(muscle.id)} aria-label={`${muscle.name}, ${statusLabels[muscle.status]}, ${muscle.recoveryPercentage} procent återhämtad`}><span>{muscle.name}</span><b>{muscle.recoveryPercentage}%</b></button>)}
      </div>
      <div className="body-legend"><button type="button" aria-expanded={legendOpen} onClick={() => setLegendOpen(value => !value)}>Teckenförklaring <ChevronDown size={16}/></button>{legendOpen && <div>{Object.entries(statusLabels).map(([id, label]) => <span key={id}><i className={id}/>{label}</span>)}</div>}</div>
    </section>
    <button type="button" className="panel body-coach-card" onClick={() => { setView(model.focusMuscles.some(id => bodyMuscles[id]?.view === 'back') ? 'back' : 'front'); setSelectedId(model.focusMuscles[0] || null) }}><Sparkles size={20}/><span><small>ASKR Coach</small><strong>{model.coach.message}</strong><em>Tryck för att markera på kroppen</em></span></button>
    <section className="panel recovery-summary"><header><span className="eyebrow">Recovery forecast · Muscle readiness</span><strong>{model.recovery.readiness}% redo</strong></header><div>{[['Recovery score',`${model.recovery.recoveryScore}%`],['Fatigue',`${model.recovery.fatigueScore}%`],['Intensitet',model.recovery.intensity],['Passlängd',`${model.recovery.duration} min`],['Träningssvit',`${model.recovery.trainingStreak} pass`],['Vilodagar',model.recovery.restDays]].map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div></section>
    <section className="panel weekly-volume"><header><div><span className="eyebrow">Den här veckan</span><h3>Veckovolym</h3></div><select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sortera veckovolym"><option value="highest">Högst volym</option><option value="lowest">Lägst volym</option><option value="alphabetical">Alfabetiskt</option></select></header>{!model.hasHistory && <p className="body-empty">Ingen historik ännu. Alla muskler börjar på 0 set.</p>}<div>{volume.map(muscle => <button type="button" key={muscle.id} onClick={() => { setView(muscle.view); setSelectedId(muscle.id) }}><span><strong>{muscle.name}</strong><small>{statusLabels[muscle.status]} · {muscle.trainingZone === 'productive' ? 'balanserad' : muscle.trainingZone}</small></span><b>{Math.round(muscle.effectiveSets)} set</b></button>)}</div></section>
    {selected && <div className="body-sheet-backdrop" onMouseDown={event => event.target === event.currentTarget && setSelectedId(null)}><section className="body-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="muscle-sheet-title"><button ref={closeRef} type="button" className="body-sheet-close" onClick={() => setSelectedId(null)} aria-label="Stäng muskeldetaljer"><X/></button><header><span className="eyebrow">Muscle intelligence</span><h2 id="muscle-sheet-title">{selected.name}</h2><span className={`body-status ${selected.status}`}>{statusLabels[selected.status]}</span></header><div className="body-sheet-score"><strong>{selected.recoveryPercentage}%</strong><span>återhämtad</span></div><dl>{[['Volym denna vecka',`${Math.round(selected.effectiveSets)} set`],['MEV / MAV / MRV',`${selected.thresholds.mev} / ${selected.thresholds.mav} / ${selected.thresholds.mrv}`],['Rekommenderade set kvar',selected.setsRemaining],['Senast tränad',selected.lastTrainedLabel],['Full återhämtning',selected.fullRecoveryLabel],['Primär utrustning',selected.equipment]].map(([term, detail]) => <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>)}</dl><div className="body-sheet-advice"><Sparkles size={18}/><p><strong>Coachens rekommendation</strong>{selected.coachRecommendation}</p></div><div><h3>Senaste övningar</h3><p>{selected.recentExercises.join(' · ') || 'Inga övningar loggade ännu'}</p></div></section></div>}
  </div>
})
