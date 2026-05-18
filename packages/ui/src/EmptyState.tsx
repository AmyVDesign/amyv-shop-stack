import type { ReactNode } from 'react'

interface EmptyStateProps {
  message: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ message, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center ${className}`}>
      <p className="text-site-muted text-sm leading-relaxed">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
