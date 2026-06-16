'use client'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Required: names the field for screen readers. */
  'aria-label': string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  'aria-label': ariaLabel,
  className = '',
}: SearchInputProps) {
  return (
    <input
      type="search"
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`rounded-xl border border-site-border bg-white px-3 py-2 text-sm text-site-text placeholder:text-site-muted focus:outline-none focus:ring-2 focus:ring-site-accent-navy ${className}`}
    />
  )
}
