import { Loader2 } from 'lucide-react'
import './brand.css'

export const ASKR_VERSION = '0.1.0'
export const ASKR_BUILD = 'Milestone A · Brand Integration'
export const ASKR_TAGLINE = 'Train. Evolve. Ascend.'

export function AskrLogo({ size = 'md', showWordmark = true, className = '', label = 'ASKR' }) {
  return (
    <span className={`askr-logo askr-logo-${size} ${className}`.trim()} aria-label={label} role="img">
      <span className="askr-helmet" aria-hidden="true">
        <svg viewBox="0 0 64 64" focusable="false">
          <path d="M33 6 12 17v16c0 13 9 22 21 25 12-3 19-12 19-25V17L33 6Z" />
          <path d="M22 25h22l-4-7-7-4-7 4-4 7Z" />
          <path d="M18 31h30l-5 10H23l-5-10Z" />
          <path d="M25 45h15l-7 7-8-7Z" />
        </svg>
      </span>
      {showWordmark && <span className="askr-wordmark">ASKR</span>}
    </span>
  )
}

export function BrandedLoader({ label = 'ASKR laddar', variant = 'pulse' }) {
  return <div className={`askr-loader askr-loader-${variant}`} role="status" aria-live="polite"><AskrLogo size="sm" showWordmark={variant === 'logo'} /><Loader2 className="askr-spinner" size={18} aria-hidden="true"/><span>{label}</span></div>
}

export function SplashScreen() {
  return <div className="askr-splash" aria-label="ASKR startar"><div className="askr-splash-glow"/><AskrLogo size="hero"/><p>{ASKR_TAGLINE}</p></div>
}

export function BrandedEmptyState({ title, children, action }) {
  return <div className="askr-empty-state"><AskrLogo size="sm" showWordmark={false}/><strong>{title}</strong>{children && <p>{children}</p>}{action}</div>
}
