import type { HTMLAttributes, PropsWithChildren } from 'react'

export function Card({ className = '', children, ...props }: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return <article className={`ride-card ${className}`} {...props}>{children}</article>
}
