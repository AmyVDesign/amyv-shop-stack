'use client'

import { useState } from 'react'

type Visibility = 'public' | 'internal' | 'ebay_only'

const visibilityLabel: Record<Visibility, string> = {
  public:    'public',
  internal:  'internal',
  ebay_only: 'eBay only',
}

export function PublicUrlBlock({
  slug,
  visibility,
}: {
  slug: string
  visibility: Visibility
}) {
  const [copyLabel, setCopyLabel] = useState<'Copy' | 'Copied'>('Copy')

  function handleCopy() {
    navigator.clipboard.writeText(window.location.origin + '/products/' + slug)
    setCopyLabel('Copied')
    setTimeout(() => setCopyLabel('Copy'), 1500)
  }

  const path = `/products/${slug}`

  return (
    <div className="pt-3">
      <p className="text-xs uppercase text-site-muted mb-1.5" style={{ letterSpacing: 'var(--label-tracking)' }}>Public URL</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-sm text-site-text">{path}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded text-xs font-medium px-2.5 py-1 border border-site-border text-site-muted hover:text-site-accent-navy hover:border-site-accent-navy transition-colors"
        >
          {copyLabel}
        </button>
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-site-accent-navy hover:underline"
        >
          Open ↗
        </a>
      </div>
      {visibility !== 'public' && (
        <p className="text-xs text-site-muted mt-1.5">
          This part is set to {visibilityLabel[visibility]}. The public URL won&apos;t load until visibility is set to Public.
        </p>
      )}
    </div>
  )
}
