interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClass = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
} as const

export function Wordmark({ size = 'md', className = '' }: WordmarkProps) {
  return (
    <span
      className={`font-display font-semibold text-site-accent-dark tracking-tight ${sizeClass[size]} ${className}`}
    >
      Ess-Kay Yards
    </span>
  )
}
