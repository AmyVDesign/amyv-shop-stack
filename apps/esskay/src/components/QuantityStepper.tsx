'use client'

interface Props {
  value: number
  min?: number
  max: number
  label: string
  onChange: (value: number) => void
}

export function QuantityStepper({ value, min = 1, max, label, onChange }: Props) {
  return (
    <div className="inline-flex items-center" role="group" aria-label={`Quantity for ${label}`}>
      <button
        type="button"
        aria-label={`Decrease quantity of ${label}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 flex items-center justify-center rounded-l border border-site-border text-site-text text-base hover:bg-site-bg-alt disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy"
      >
        <span aria-hidden="true">-</span>
      </button>
      <span
        aria-live="polite"
        aria-atomic="true"
        className="w-8 h-8 flex items-center justify-center border-y border-site-border text-sm font-medium text-site-text tabular-nums select-none"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase quantity of ${label}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 flex items-center justify-center rounded-r border border-site-border text-site-text text-base hover:bg-site-bg-alt disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  )
}
