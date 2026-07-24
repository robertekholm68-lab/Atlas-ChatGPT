import { Activity, ArrowRight, Bot, HeartPulse, Home, MessageCircle, Moon, Target, TrendingUp, UserRound, Zap } from 'lucide-react'

import { atlasHomeTokens, buildHomeViewModel, safeHomeTarget } from './atlasHomeModel.js'
import { sharedComponentStyles } from './theme/componentStyles'

export { atlasHomeTokens, buildHomeViewModel }

export function AtlasCard({ className = '', children }) { return <section className={`atlas-card ${className}`} style={sharedComponentStyles.card}>{children}</section> }
export function AtlasPrimaryButton({ children, onClick, ariaLabel }) { return <button type="button" className="atlas-btn atlas-btn-primary" style={sharedComponentStyles.button.primary} onClick={onClick} aria-label={ariaLabel}>{children}</button> }
export function AtlasSecondaryButton({ children, onClick }) { return <button type="button" className="atlas-btn atlas-btn-secondary" style={sharedComponentStyles.button.secondary} onClick={onClick}>{children}</button> }
export function AtlasProgress({ value, max = 100, label }) { const width = Math.max(0, Math.min(100, max ? (Number(value || 0) / max) * 100 : 0)); return <div className="atlas-progress" style={sharedComponentStyles.progress.track} role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(width)}><span style={{ ...sharedComponentStyles.progress.indicator, width: `${width}%` }}/></div> }

const metricIcons = { recovery: HeartPulse, sleep: Moon, energy: Zap, motivation: Target, week: Activity }
const navItems = [['today','Idag',Home],['coach','Coach',Bot],['goal','Mål',Target],['recovery','Kropp',HeartPulse],['decisions','Beslut',Activity]]

function ReadinessDial({ value, hasData }) {
  if (!hasData) return <div className="atlas-readiness-dial empty" aria-label="Readiness saknas"><strong>–</strong><span>Ej loggat</span></div>
  const score = Number.parseInt(String(value || '0'), 10) || 0
  return <div className="atlas-readiness-dial" style={{ '--score': `${Math.max(0, Math.min(100, score))}%` }} aria-label={`Readiness ${score}%`}><strong>{score}</strong><span>Ready</span></div>
}

export function AtlasBottomNavigation({ page, setPage }) { return <nav className="atlas-home-bottom-nav" aria-label="Mobil navigation">{navItems.map(([id,label,Icon]) => <button type="button" key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)} aria-current={page === id ? 'page' : undefined}><Icon size={21}/><span>{label}</span></button>)}</nav> }

export function AtlasHomeScreen({ profile, core, recommendation, readiness, setPage, now }) {
  const vm = buildHomeViewModel({ profile, core, recommendation, readiness, now })
  const go = target => setPage(safeHomeTarget(target, 'today'))
  const recoveryMetric = vm.metrics.find(metric => metric.id === 'recovery')

  return <div className="atlas-home-page">
    <header className="atlas-home-header"><div className="atlas-home-brand"><img src="/assets/branding/logos/askr-wordmark-horizontal.png" alt="ASKR"/></div><div className="atlas-header-status"><span>{vm.greeting}</span><button type="button" className="atlas-avatar-button" aria-label="Öppna profil"><UserRound size={19}/></button></div></header>

    <section className={`atlas-home-hero ${vm.insufficient ? 'insufficient' : ''}`}>
      <div className="atlas-hero-copy"><span className="atlas-kicker">Dagens beslut</span><h1>{vm.headline}</h1><p>{vm.explanation}</p><div className="atlas-confidence"><TrendingUp size={16}/>{vm.confidence}</div><div className="atlas-actions"><AtlasPrimaryButton onClick={() => go(vm.primaryTarget)}><Zap size={18}/>{vm.primaryLabel}</AtlasPrimaryButton>{vm.secondary && <AtlasSecondaryButton onClick={() => go(vm.secondary.target)}>{vm.secondary.label}<ArrowRight size={17}/></AtlasSecondaryButton>}</div></div>
      <aside className="atlas-hero-panel"><ReadinessDial value={recoveryMetric?.value} hasData={vm.hasRecoveryData}/><span>Readiness</span><strong>{vm.hasRecoveryData ? vm.status : 'Ingen återhämtningsdata loggad ännu.'}</strong></aside>
    </section>

    <section className="atlas-metric-grid" aria-label="Dagens statistik">{vm.metrics.length ? vm.metrics.map(metric => { const Icon = metric.icon || metricIcons[metric.id] || Activity; return <article className="atlas-metric" key={metric.id}><div><Icon size={18}/><span>{metric.label}</span></div><strong>{metric.value}</strong><small>{metric.note}</small></article> }) : <AtlasCard className="atlas-empty-card"><p>Ingen dagsstatistik loggad ännu.</p></AtlasCard>}</section>

    <AtlasCard className="atlas-recovery-card"><div className="atlas-section-head"><span>Recovery</span><b>{vm.hasRecoveryData ? 'Aktuell belastning' : 'Tomt läge'}</b></div>{vm.muscles.length ? <div className="atlas-muscle-list">{vm.muscles.map(m => <div key={m.name}><span>{m.name}</span><AtlasProgress value={m.readiness} label={`${m.name} återhämtning`}/><b>{m.readiness}%</b></div>)}</div> : <p className="atlas-empty">Ingen lokal muskelåterhämtning loggad ännu. Logga ett pass för att visa verklig readiness.</p>}</AtlasCard>

    <AtlasCard className="atlas-coach-card"><div><span className="atlas-kicker">AI Coach</span><h3>{vm.coachTitle}</h3><p>{vm.coachSummary}</p></div><AtlasSecondaryButton onClick={() => go('coach')}><MessageCircle size={18}/>Fråga coachen</AtlasSecondaryButton></AtlasCard>

    <AtlasCard className="atlas-week-card"><div className="atlas-section-head"><span>Idag statistik</span><b>{vm.weeklyCompletion !== null ? `${vm.weeklyCompletion}/${vm.weeklyTarget || '–'} pass` : 'Tomt läge'}</b></div>{vm.weeklyCompletion !== null ? <AtlasProgress value={vm.weeklyCompletion || 0} max={vm.weeklyTarget || 1} label="Veckans träningsmål"/> : <p className="atlas-empty">Veckostatistik visas när träningspass finns sparade.</p>}</AtlasCard>

    <AtlasCard className="atlas-activity-card"><div className="atlas-section-head"><span>Senaste aktivitet</span></div>{vm.latest ? <p><strong>{vm.latest.name || 'Träningspass'}</strong><br/><small>{vm.latest.sets ? `${vm.latest.sets} set` : 'Genomfört pass'}</small></p> : <p className="atlas-empty">Inget genomfört pass finns sparat ännu.</p>}</AtlasCard>
  </div>
}
