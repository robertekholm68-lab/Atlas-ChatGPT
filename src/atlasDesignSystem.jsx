import { ChevronRight } from 'lucide-react'

export const atlasTheme = {
  color: {
    primaryLime: '#d9ff4f',
    secondaryLime: '#8dff72',
    darkBackground: '#020403',
    darkCard: '#0d1512',
    border: 'rgba(223, 255, 225, 0.12)',
    divider: 'rgba(223, 255, 225, 0.08)',
    textPrimary: '#f5fff8',
    textSecondary: '#8f9f96',
    disabled: '#46534c',
    success: '#8dff72',
    warning: '#ffd166',
    error: '#ff6b6b',
    accentCyan: '#6df7e7',
    accentOrange: '#ff9f4a',
    glowLime: 'rgba(217, 255, 79, 0.28)',
    glowCyan: 'rgba(109, 247, 231, 0.18)'
  },
  radius: { sm: 14, md: 22, lg: 30, xl: 38 },
  spacing: { xs: 6, sm: 10, md: 16, lg: 24, xl: 36, xxl: 56 },
  typography: {
    display: 'clamp(42px, 7vw, 78px)',
    h1: 'clamp(34px, 5vw, 56px)',
    h2: 'clamp(28px, 4vw, 44px)',
    h3: '24px',
    section: '13px',
    body: '16px',
    small: '13px',
    caption: '11px',
    metric: 'clamp(32px, 4vw, 52px)',
    button: '14px'
  }
}

export function Card({ children, className = '', as: Tag = 'section' }) {
  return <Tag className={`atlas-card ${className}`.trim()}>{children}</Tag>
}

export function AtlasCard(props) { return <Card {...props} /> }
export function AtlasPanel(props) { return <Card {...props} className={`atlas-panel ${props.className || ''}`.trim()} /> }

export function SectionTitle({ eyebrow, title, action, onAction }) {
  return <div className="atlas-section-title"><div>{eyebrow && <span>{eyebrow}</span>}<h3>{title}</h3></div>{action && <button type="button" onClick={onAction}>{action}<ChevronRight size={16}/></button>}</div>
}

export function AtlasSectionHeader(props) { return <SectionTitle {...props} /> }

export function ActionButton({ children, variant = 'primary', className = '', ...props }) {
  return <button type="button" className={`atlas-button ${variant} ${className}`.trim()} {...props}>{children}</button>
}

export function AtlasButton(props) { return <ActionButton {...props} /> }

export function AtlasHero({ eyebrow, title, body, action, children, className = '' }) {
  return <Card className={`atlas-hero ${className}`.trim()}><div>{eyebrow && <span className="atlas-chip glow">{eyebrow}</span>}<h2>{title}</h2>{body && <p>{body}</p>}{action}</div>{children}</Card>
}

export function AtlasChip({ children, tone = 'lime' }) {
  return <span className={`atlas-chip ${tone}`}>{children}</span>
}

export function StatCard({ icon: Icon, label, value, note, tone = '' }) {
  return <Card as="article" className="atlas-stat-card"><div className="atlas-stat-icon">{Icon && <Icon size={20}/>}</div><span>{label}</span><strong>{value}</strong>{note && <small className={tone}>{note}</small>}</Card>
}

export function AtlasStatCard(props) { return <StatCard {...props} /> }
export function AtlasMetric(props) { return <StatCard {...props} /> }

export function ProgressRing({ value, label, size = 132 }) {
  return <div className="atlas-progress-ring" style={{ '--value': `${value * 3.6}deg`, width: size, height: size }}><strong>{value}</strong><span>{label}</span></div>
}

export function AtlasProgressRing(props) { return <ProgressRing {...props} /> }

export function WorkoutCard({ title, meta, tag, onStart }) {
  return <Card as="article" className="atlas-workout-card"><div><span>{tag}</span><h3>{title}</h3><p>{meta}</p></div><ActionButton onClick={onStart}>Starta</ActionButton></Card>
}

export function ExerciseRow({ index, title, subtitle, value, children, onClick }) {
  return <button type="button" className="atlas-exercise-row atlas-list-item" onClick={onClick}><b>{index}</b><span><strong>{title}</strong><small>{subtitle}</small></span><em>{value}</em>{children}</button>
}

export function AtlasListItem({ children, onClick, className = '' }) {
  const Tag = onClick ? 'button' : 'div'
  return <Tag type={onClick ? 'button' : undefined} className={`atlas-list-item ${className}`.trim()} onClick={onClick}>{children}</Tag>
}

export function BottomNavigation({ items, active, onChange }) {
  return <nav className="atlas-bottom-nav atlas-navigation" aria-label="Primär mobilnavigation">{items.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={active === id ? 'active' : ''} onClick={() => onChange(id)}><Icon size={20}/><span>{label}</span></button>)}</nav>
}
