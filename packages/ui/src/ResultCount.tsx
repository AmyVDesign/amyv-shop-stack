interface ResultCountProps {
  shown: number
  total: number
  noun: string
  className?: string
}

export function ResultCount({ shown, total, noun, className = '' }: ResultCountProps) {
  return (
    <p aria-live="polite" className={`text-xs text-site-muted mb-4 ${className}`}>
      Showing {shown} of {total} {noun}
    </p>
  )
}
