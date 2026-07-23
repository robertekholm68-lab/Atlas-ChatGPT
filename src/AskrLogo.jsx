import { useState } from 'react'

const ASKR_LOGO_SRC = '/assets/branding/askr-logo.png'
const ASKR_ICON_SRC = '/assets/branding/askr-icon.png'

const dimensions = {
  logo: { width: 142, height: 42 },
  icon: { width: 42, height: 42 }
}

export default function AskrLogo({ variant = 'logo', className = '', label = 'ASKR' }) {
  const [available, setAvailable] = useState(true)
  const source = variant === 'icon' ? ASKR_ICON_SRC : ASKR_LOGO_SRC
  const size = dimensions[variant] || dimensions.logo

  return (
    <span
      className={`askr-logo askr-logo-${variant} ${!available ? 'is-empty' : ''} ${className}`.trim()}
      style={{ '--askr-logo-width': `${size.width}px`, '--askr-logo-height': `${size.height}px` }}
      aria-label={label}
      role="img"
    >
      {available && <img src={source} alt="" width={size.width} height={size.height} onError={() => setAvailable(false)} />}
    </span>
  )
}
