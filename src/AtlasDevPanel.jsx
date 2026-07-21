import { Activity, Brain, Database, HeartPulse, ListChecks, Target, X } from 'lucide-react'
import './atlasDevPanel.css'

function Stat({ icon: Icon, label, value }) {
  return <div className="atlas-dev-stat"><Icon size={17}/><span>{label}</span><strong>{value}</strong></div>
}

export default function AtlasDevPanel({ core, onClose }) {
  const current = core.decisions?.current
  const logs = core.decisions?.logs || []
  const muscles = Object.entries(core.recovery?.muscles || {})
    .map(([name, value]) => ({ name, fatigue: Number(value?.fatigue || 0), readiness: Math.max(0, Math.round(100 - Number(value?.fatigue || 0))) }))
    .sort((a, b) => a.readiness - b.readiness)

  return <aside className="atlas-dev-panel" aria-label="ATLAS utvecklarpanel">
    <header>
      <div><span>Intern diagnostik</span><h2>ATLAS Core</h2></div>
      <button type="button" onClick={onClose} aria-label="Stäng utvecklarpanelen"><X size={19}/></button>
    </header>

    <div className="atlas-dev-stats">
      <Stat icon={Activity} label="Events" value={core.events?.length || 0}/>
      <Stat icon={Database} label="Workouts" value={core.workouts?.length || 0}/>
      <Stat icon={Target} label="Goals" value={core.goals?.length || 0}/>
      <Stat icon={Brain} label="Beslut" value={core.decisions?.history?.length || 0}/>
      <Stat icon={HeartPulse} label="Recovery" value={`${core.recovery?.score ?? 100}%`}/>
      <Stat icon={ListChecks} label="Körningar" value={logs.length}/>
    </div>

    <section>
      <span className="atlas-dev-eyebrow">Aktuellt beslut</span>
      {current ? <div className={`atlas-dev-decision ${current.priority || ''}`}>
        <strong>{current.title}</strong>
        <p>{current.message}</p>
        <div>{(current.evidence || []).map(item => <span key={item}>{item}</span>)}</div>
      </div> : <p className="atlas-dev-empty">Inget beslut har skapats ännu.</p>}
    </section>

    <section>
      <span className="atlas-dev-eyebrow">Muskelstatus</span>
      <div className="atlas-dev-muscles">
        {muscles.length ? muscles.map(item => <div key={item.name}>
          <span>{item.name}</span><i><b style={{ width: `${item.readiness}%` }}/></i><strong>{item.readiness}%</strong>
        </div>) : <p className="atlas-dev-empty">Genomför ett pass för att skapa muskeldata.</p>}
      </div>
    </section>

    <section>
      <span className="atlas-dev-eyebrow">Senaste beslutslogg</span>
      {logs[0] ? <div className="atlas-dev-log">
        <small>{logs[0].trigger} · {new Date(logs[0].createdAt).toLocaleString('sv-SE')}</small>
        {(logs[0].steps || []).map((step, index) => <div key={`${step.label}-${index}`}><span>{index + 1}</span><p>{step.label}</p></div>)}
      </div> : <p className="atlas-dev-empty">Ingen beslutslogg finns ännu.</p>}
    </section>
  </aside>
}
