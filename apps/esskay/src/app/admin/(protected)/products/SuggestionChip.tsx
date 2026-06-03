'use client'

export type Confidence = 'high' | 'medium' | 'low'

interface Props {
  suggestion: string | null
  confidence: Confidence
  onAccept: () => void
  onIgnore: () => void
}

const confidenceClass: Record<Confidence, string> = {
  high:   'text-green-700',
  medium: 'text-amber-700',
  low:    'text-site-muted',
}

export function SuggestionChip({ suggestion, confidence, onAccept, onIgnore }: Props) {
  if (!suggestion) return null

  return (
    <div className="mt-1.5 flex items-start gap-2 rounded bg-site-bg border border-site-border px-2.5 py-1.5">
      <div className="flex-1 min-w-0 text-xs leading-snug">
        <span className="text-site-muted">Suggested: </span>
        <span className="font-medium text-site-text">{suggestion}</span>
        <span className={`ml-1 ${confidenceClass[confidence]}`}>
          ({confidence} confidence)
        </span>
      </div>
      <div className="flex gap-1.5 flex-none">
        <button
          type="button"
          onClick={onAccept}
          aria-label={`Accept suggestion: ${suggestion}`}
          className="text-xs px-2 py-0.5 rounded bg-site-accent-dark text-white hover:bg-site-accent transition-colors"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={onIgnore}
          aria-label="Ignore suggestion"
          className="text-xs px-2 py-0.5 rounded border border-site-border text-site-muted hover:text-site-text transition-colors"
        >
          Ignore
        </button>
      </div>
    </div>
  )
}
