import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & { variant?: 'primary' | 'secondary' | 'ghost' }
export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return <button className={`ride-button ride-button--${variant} ${className}`} {...props}>{children}</button>
}
