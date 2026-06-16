import type { ReactNode } from 'react'

interface DataToolbarProps {
  children: ReactNode
  className?: string
}

export function DataToolbar({ children, className = '' }: DataToolbarProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 mb-4 ${className}`}>
      {children}
    </div>
  )
}
