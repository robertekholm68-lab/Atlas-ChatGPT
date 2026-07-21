import { ChevronRight } from 'lucide-react'

export function Card({ children, className = '', as: Tag = 'section' }) {
  return <Tag className={`atlas-card ${className}`.trim()}>{children}</Tag>
}

export function SectionTitle({ eyebrow, title, action, onAction }) {
  return <div className="atlas-section-title"><div>{eyebrow && <span>{eyebrow}</span>}<h3>{title}</h3></div>{action && <button type="button" onClick={onAction}>{action}<ChevronRight size={16}/></button>}</div>
}

export function ActionButton({ children, variant = 'primary', className = '', ...props }) {
  return <button type="button" className={`atlas-button ${variant} ${className}`.trim()} {...props}>{children}</button>
}

export function StatCard({ icon: Icon, label, value, note, tone = '' }) {
  return <Card as="article" className="atlas-stat-card"><div className="atlas-stat-icon">{Icon && <Icon size={20}/>}</div><span>{label}</span><strong>{value}</strong>{note && <small className={tone}>{note}</small>}</Card>
}

export function ProgressRing({ value, label, size = 132 }) {
  return <div className="atlas-progress-ring" style={{ '--value': `${value * 3.6}deg`, width: size, height: size }}><strong>{value}</strong><span>{label}</span></div>
}

export function WorkoutCard({ title, meta, tag, onStart }) {
  return <Card as="article" className="atlas-workout-card"><div><span>{tag}</span><h3>{title}</h3><p>{meta}</p></div><ActionButton onClick={onStart}>Starta</ActionButton></Card>
}

export function ExerciseRow({ index, title, subtitle, value, children, onClick }) {
  return <button type="button" className="atlas-exercise-row" onClick={onClick}><b>{index}</b><span><strong>{title}</strong><small>{subtitle}</small></span><em>{value}</em>{children}</button>
}

export function BottomNavigation({ items, active, onChange }) {
  return <nav className="atlas-bottom-nav" aria-label="Primär mobilnavigation">{items.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={active === id ? 'active' : ''} onClick={() => onChange(id)}><Icon size={20}/><span>{label}</span></button>)}</nav>
}
