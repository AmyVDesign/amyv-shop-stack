import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  title?: ReactNode
  className?: string
  onClick?: () => void
  href?: string
}

export function Card({ children, title, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`border border-site-border rounded-xl p-6 ${onClick ? 'cursor-pointer hover:border-site-accent-dark/30 transition-colors' : ''} ${className}`}
    >
      {title !== undefined && (
        <div className="text-sm text-site-muted mb-2">{title}</div>
      )}
      {children}
    </div>
  )
}
