import type { ReactNode } from 'react'

type BadgeVariant = 'green' | 'gray' | 'blue' | 'orange'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
  className?: string
}

const variantClass: Record<BadgeVariant, string> = {
  green:  'bg-green-100  text-green-800',
  gray:   'bg-gray-100   text-gray-700',
  blue:   'bg-blue-100   text-blue-800',
  orange: 'bg-orange-100 text-orange-700',
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClass[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
