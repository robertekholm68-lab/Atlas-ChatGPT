import { useMemo, useState } from 'react'
import { Activity, Bell, ChevronRight, Droplets, HeartPulse, Moon, Sparkles, Utensils, Zap } from 'lucide-react'
import { buildRecoveryPlatformModel, recoveryStatuses } from './recoveryPlatformModel'
import './recoveryPlatform.css'

export default function RecoveryPlatform({ core = {} }) {
  const model = useMemo(() => buildRecoveryPlatformModel(core), [core])
  const [view, setView] = useState('front')
  const [selectedId, setSelectedId] = useState(model.limiting[0]?.id || model.muscles[0].id)
  const selected = model.muscles.find(muscle => muscle.id === selectedId) || model.muscles[0]
  const visibleMuscles = model.muscles.filter(muscle => muscle.view === view || view === 'all')

  return <main className="recovery-shell">
    <section className="recovery-hero" aria-labelledby="recovery-title">
      <div>
        <span className="recovery-pill"><Sparkles size={16}/> Recovery Platform 1.0</span>
        <h1 id="recovery-title">Recovery command center</h1>
        <p>Training load, muscle fatigue, nutrition, hydration, stress, sleep and heart metric architecture feed one premium recovery score.</p>
        <div className="recovery-actions" aria-label="Quick recovery actions">
          <button>Log hydration</button><button>Plan deload</button><button>Start mobility</button>
        </div>
      </div>
      <RecoveryRing score={model.score} label={model.readiness}/>
    </section>

    <section className="recovery-grid">
      <ReadinessCard model={model}/>
      <MetricCard icon={Zap} title="Training recommendation" value={model.recommendation} text="Always explained from limiting muscles, recent load, and placeholder lifestyle signals." />
      <MetricCard icon={Moon} title="Sleep preparation" value="Placeholder" text="Duration, quality, deep sleep, REM, restlessness and sleep debt are ready for future wearables." />
      <MetricCard icon={Droplets} title="Hydration status" value="Needs log" text="Hydration status is architected for nutrition and notification impact." />
      <MetricCard icon={Utensils} title="Nutrition impact" value="Prepared" text="Protein, calories, meal timing, recovery meals and supplements placeholders are modeled." />
      <TrendCard values={model.weeklyTrend}/>
      <MuscleMap view={view} setView={setView} muscles={visibleMuscles} selectedId={selectedId} setSelectedId={setSelectedId}/>
      <MuscleDetail muscle={selected}/>
      <Timeline timeline={model.timeline}/>
      <History history={model.history} muscles={model.muscles}/>
      <Architecture integrations={model.integrations}/>
    </section>
  </main>
}

function RecoveryRing({ score, label }) { return <div className="recovery-ring" style={{ '--score': `${score * 3.6}deg` }} aria-label={`Recovery score ${score}, ${label}`}><strong>{score}</strong><span>{label}</span><small>Recovery Score</small></div> }
function ReadinessCard({ model }) { return <article className="recovery-card readiness-card"><span className="card-kicker"><HeartPulse size={16}/> Today's readiness</span><h2>{model.readiness}</h2><p>{model.recommendation}</p><ul>{model.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul></article> }
function MetricCard({ icon: Icon, title, value, text }) { return <article className="recovery-card recovery-metric"><Icon size={20}/><span>{title}</span><strong>{value}</strong><p>{text}</p></article> }
function TrendCard({ values }) { return <article className="recovery-card trend-card"><span className="card-kicker"><Activity size={16}/> Weekly recovery trend</span><div className="recovery-bars">{values.map((value, index) => <i key={index} style={{ height: `${value}%` }}><b>{value}</b></i>)}</div><p>Accessible chart: {values.join(', ')}.</p></article> }

function MuscleMap({ view, setView, muscles, selectedId, setSelectedId }) { return <article className="recovery-card muscle-map-card"><div className="section-title"><div><span>Interactive Muscle Recovery Map</span><h2>Muscle heat map</h2></div><ChevronRight size={18}/></div><div className="view-tabs" role="tablist" aria-label="Muscle map views">{['front','back','side','all'].map(item => <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>{item}</button>)}</div><div className={`muscle-map ${view}`}>{muscles.map(muscle => <button key={muscle.id} className={`muscle-chip ${muscle.status} ${selectedId === muscle.id ? 'selected' : ''}`} onClick={() => setSelectedId(muscle.id)} aria-label={`${muscle.name}: ${muscle.status}, ${muscle.score} recovery`}><span>{muscle.name}</span><b>{muscle.score}</b></button>)}</div><div className="recovery-legend">{recoveryStatuses.map(status => <span key={status.id}><i className={status.id}/>{status.label}</span>)}</div></article> }
function MuscleDetail({ muscle }) { return <article className="recovery-card muscle-detail-card"><span className="card-kicker">Muscle detail</span><h2>{muscle.name}</h2><div className="detail-split"><RecoveryRing score={muscle.score} label={muscle.status}/><div><p><strong>{muscle.hoursRemaining}</strong> estimated hours remaining</p><p>Training load {muscle.trainingLoad}% · {muscle.notes}</p></div></div><div className="detail-lists"><InfoList title="Recent exercises" items={muscle.recentExercises}/><InfoList title="Suggested exercises" items={muscle.suggestedExercises}/><InfoList title="Recovery tools" items={[muscle.suggestedRest,'Stretch placeholder','Mobility placeholder','Massage placeholder','Heat/Ice placeholder']}/></div><div className="mini-chart" aria-label={`Volume history ${muscle.volumeHistory.join(', ')}`}>{muscle.volumeHistory.map((value, index) => <i key={index} style={{ height: `${value}%` }}/>)}</div></article> }
function InfoList({ title, items }) { return <div><h3>{title}</h3>{items.map(item => <span key={item}>{item}</span>)}</div> }
function Timeline({ timeline }) { return <article className="recovery-card timeline-card"><span className="card-kicker">Recovery Timeline</span>{timeline.map(item => <div className="timeline-row" key={item.day}><strong>{item.day}</strong><p>{item.workout}</p><small>{item.nutrition} · {item.sleep} · {item.hydration} · {item.ai}</small></div>)}</article> }
function History({ history, muscles }) { return <article className="recovery-card history-card"><span className="card-kicker">Recovery History</span><div className="history-stats"><b>Weekly avg {history.weeklyAverage}</b><b>Monthly {history.monthlyTrend}</b><b>{history.trainingConsistency}</b><b>{history.recoveryConsistency}</b></div><p>Muscle fatigue trends: {muscles.slice(0, 5).map(m => `${m.name} ${m.fatigue}%`).join(', ')}.</p>{history.milestones.map(item => <span className="milestone" key={item}>{item}</span>)}</article> }
function Architecture({ integrations }) { return <article className="recovery-card architecture-card"><span className="card-kicker"><Bell size={16}/> Future-ready architecture</span>{Object.entries(integrations).map(([key, items]) => <div key={key}><h3>{key}</h3><p>{items.join(' · ')}</p></div>)}</article> }
