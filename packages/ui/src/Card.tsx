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
      className={`bg-white border border-[#0F3A57]/10 rounded-lg p-6 ${onClick ? 'cursor-pointer hover:border-[#0F3A57]/30 transition-colors' : ''} ${className}`}
    >
      {title !== undefined && (
        <div className="text-sm text-gray-500 mb-2">{title}</div>
      )}
      {children}
    </div>
  )
}
