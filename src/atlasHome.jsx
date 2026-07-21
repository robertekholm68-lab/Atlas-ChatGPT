import { Activity, ArrowRight, Bot, CalendarDays, CheckCircle2, Dumbbell, HeartPulse, Home, Moon, Target, UserRound, Zap } from 'lucide-react'

import { atlasHomeTokens, buildHomeViewModel, safeHomeTarget } from './atlasHomeModel.js'

export { atlasHomeTokens, buildHomeViewModel }

export function AtlasCard({ className = '', children }) { return <section className={`atlas-card ${className}`}>{children}</section> }
export function AtlasPrimaryButton({ children, onClick, ariaLabel }) { return <button type="button" className="atlas-btn atlas-btn-primary" onClick={onClick} aria-label={ariaLabel}>{children}</button> }
export function AtlasSecondaryButton({ children, onClick }) { return <button type="button" className="atlas-btn atlas-btn-secondary" onClick={onClick}>{children}</button> }
export function AtlasProgress({ value, max = 100, label }) { const width = Math.max(0, Math.min(100, max ? (Number(value || 0) / max) * 100 : 0)); return <div className="atlas-progress" aria-label={label} aria-valuenow={Math.round(width)}><span style={{ width: `${width}%` }}/></div> }

export function AtlasBottomNavigation({ page, setPage }) { const items = [['today','Idag',Home],['coach','Coach',Bot],['goal','Mål',Target],['recovery','Kropp',HeartPulse],['decisions','Beslut',Activity]]; return <nav className="atlas-home-bottom-nav" aria-label="Mobil navigation">{items.map(([id,label,Icon]) => <button type="button" key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)} aria-current={page === id ? 'page' : undefined}><Icon size={21}/><span>{label}</span></button>)}</nav> }

export function AtlasHomeScreen({ profile, core, recommendation, readiness, setPage, now }) {
  const vm = buildHomeViewModel({ profile, core, recommendation, readiness, now })
  const go = target => setPage(safeHomeTarget(target, 'today'))
  return <div className="atlas-home-page">
    <header className="atlas-home-header"><div className="atlas-home-brand"><span>A</span><div><strong>ATLAS</strong><small>Today</small></div></div><button type="button" className="atlas-avatar-button" aria-label="Öppna profil"><UserRound size={19}/></button></header>
    <section className="atlas-greeting"><span>{vm.greeting}</span><h1>Dagens plan är klar</h1><p>{vm.status}</p></section>
    <AtlasCard className={`atlas-decision ${vm.insufficient ? 'insufficient' : ''}`}><span className="atlas-kicker">DAGENS BESLUT</span><h2>{vm.headline}</h2><p>{vm.explanation}</p><small>{vm.confidence}</small><div className="atlas-actions"><AtlasPrimaryButton onClick={() => go(vm.primaryTarget)}><Zap size={18}/>{vm.primaryLabel}</AtlasPrimaryButton>{vm.secondary && <AtlasSecondaryButton onClick={() => go(vm.secondary.target)}>{vm.secondary.label}<ArrowRight size={17}/></AtlasSecondaryButton>}</div></AtlasCard>
    <section className="atlas-metric-grid" aria-label="Daglig status">{vm.metrics.length ? vm.metrics.map(metric => { const Icon = metric.icon; return <article className="atlas-metric" key={metric.id}><Icon size={18}/><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></article> }) : <AtlasCard><p>Ej loggat ännu.</p></AtlasCard>}</section>
    <AtlasCard><div className="atlas-section-head"><span>Muskel / recovery</span><b>Aktuell belastning</b></div>{vm.muscles.length ? <div className="atlas-muscle-list">{vm.muscles.map(m => <div key={m.name}><span>{m.name}</span><AtlasProgress value={m.readiness} label={`${m.name} återhämtning`}/><b>{m.readiness}%</b></div>)}</div> : <p className="atlas-empty">Ingen lokal muskelåterhämtning loggad ännu.</p>}</AtlasCard>
    <AtlasCard className="atlas-workout-card"><span className="atlas-kicker">DAGENS WORKOUT</span><h3>{vm.workoutName}</h3><p>{vm.workoutNote}</p><AtlasPrimaryButton onClick={() => go(vm.workoutTarget)}><Dumbbell size={18}/>Visa pass</AtlasPrimaryButton></AtlasCard>
    <AtlasCard><div className="atlas-section-head"><span>Veckoöversikt</span><b>{vm.weeklyCompletion ?? 0}/{vm.weeklyTarget || '–'} pass</b></div><AtlasProgress value={vm.weeklyCompletion || 0} max={vm.weeklyTarget || 1} label="Veckans träningsmål"/></AtlasCard>
    <AtlasCard><div className="atlas-section-head"><span>Senaste aktivitet</span></div>{vm.latest ? <p><strong>{vm.latest.name || 'Träningspass'}</strong><br/><small>{vm.latest.sets ? `${vm.latest.sets} set` : 'Genomfört pass'}</small></p> : <p className="atlas-empty">Inget genomfört pass finns sparat ännu.</p>}</AtlasCard>
  </div>
}
