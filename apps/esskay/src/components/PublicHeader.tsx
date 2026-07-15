'use client'

import Link from 'next/link'
import { Wordmark } from '@amyv/ui'
import { CartIndicator } from './CartIndicator'

export function PublicHeader() {
  return (
    <header className="border-b border-site-border bg-site-bg">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Wordmark size="sm" />
        <nav className="flex items-center gap-6" aria-label="Site navigation">
          <Link
            href="/products"
            className="text-sm text-site-muted hover:text-site-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded"
          >
            Parts
          </Link>
          <CartIndicator />
        </nav>
      </div>
    </header>
  )
}
