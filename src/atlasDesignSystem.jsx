import { AlertCircle, CheckCircle2, ChevronRight, Loader2, Sparkles } from 'lucide-react'
import { sharedComponentStyles } from './theme/componentStyles'

export function Card({ children, className = '', as: Tag = 'section', elevated = false, style, ...props }) {
  return <Tag className={`atlas-card motion-scale-in ${elevated ? 'is-elevated' : ''} ${className}`.trim()} style={{ ...sharedComponentStyles.card, ...style }} {...props}>{children}</Tag>
}

export function SectionTitle({ eyebrow, title, action, onAction }) {
  return <div className="atlas-section-title"><div>{eyebrow && <span>{eyebrow}</span>}<h3>{title}</h3></div>{action && <button type="button" className="atlas-link-button" onClick={onAction}>{action}<ChevronRight size={16}/></button>}</div>
}

export function ActionButton({ children, variant = 'primary', state = 'idle', className = '', style, ...props }) {
  const Icon = state === 'loading' ? Loader2 : state === 'success' ? CheckCircle2 : state === 'error' ? AlertCircle : null
  const buttonStyle = sharedComponentStyles.button[variant] || sharedComponentStyles.button.primary
  return <button type="button" aria-busy={state === 'loading'} disabled={props.disabled || state === 'loading'} className={`atlas-button ${variant} is-${state} ${className}`.trim()} style={{ ...buttonStyle, ...style }} {...props}>{Icon && <Icon size={17} className={state === 'loading' ? 'spin' : ''}/>}<span>{children}</span></button>
}

export function StatCard({ icon: Icon, label, value, note, tone = '' }) {
  return <Card as="article" className="atlas-stat-card"><div className="atlas-stat-icon">{Icon && <Icon size={20} strokeWidth={2}/>}</div><span>{label}</span><strong>{value}</strong>{note && <small className={tone}>{note}</small>}</Card>
}

export function ProgressRing({ value, label, size = 132 }) {
  return <div className="atlas-progress-ring motion-scale-in" style={{ '--value': `${value * 3.6}deg`, '--askr-progress': sharedComponentStyles.progressRing.foreground, '--askr-progress-track': sharedComponentStyles.progressRing.backgroundTrack, '--askr-progress-inner': sharedComponentStyles.progressRing.inner, width: size, height: size }} role="img" aria-label={`${label}: ${value} procent`}><strong>{value}</strong><span>{label}</span></div>
}

export function WorkoutCard({ title, meta, tag, onStart }) {
  return <Card as="article" className="atlas-workout-card"><div><span>{tag}</span><h3>{title}</h3><p>{meta}</p></div><ActionButton onClick={onStart}>Starta</ActionButton></Card>
}

export function ExerciseRow({ index, title, subtitle, value, children, onClick }) {
  return <button type="button" className="atlas-exercise-row" onClick={onClick}><b>{index}</b><span><strong>{title}</strong><small>{subtitle}</small></span><em>{value}</em>{children}</button>
}

export function BottomNavigation({ items, active, onChange }) {
  return <nav className="atlas-bottom-nav" aria-label="Primär mobilnavigation">{items.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-label={label} aria-current={active === id ? 'page' : undefined} className={active === id ? 'active' : ''} onClick={() => onChange(id)}><Icon size={20} strokeWidth={2}/><span>{label}</span></button>)}</nav>
}

export function SkeletonBlock({ className = '', label = 'Laddar innehåll' }) {
  return <div className={`skeleton ${className}`.trim()} role="status" aria-label={label}/>
}

export function EmptyState({ icon: Icon = Sparkles, title, children, action, onAction }) {
  return <div className="empty-state-premium motion-scale-in"><Icon size={32}/><strong>{title}</strong>{children && <p>{children}</p>}{action && <ActionButton variant="secondary" onClick={onAction}>{action}</ActionButton>}</div>
}
