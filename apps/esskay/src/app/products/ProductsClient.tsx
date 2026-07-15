'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/format'

export type ListingCard = {
  slug: string
  title: string
  part_number: string | null
  photoUrl: string | null
  conditionSummary: string
  minPriceCents: number
  maxPriceCents: number
  combinedQty: number
}

export function ProductsClient({ cards }: { cards: ListingCard[] }) {
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = q
    ? cards.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.part_number ?? '').toLowerCase().includes(q),
      )
    : cards

  const resultLabel =
    q
      ? `${filtered.length} ${filtered.length === 1 ? 'result' : 'results'}`
      : `${cards.length} ${cards.length === 1 ? 'part' : 'parts'}`

  return (
    <>
      {/* Search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative">
          <label htmlFor="parts-search" className="sr-only">
            Search parts
          </label>
          <input
            id="parts-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or part number"
            className="w-full sm:w-80 rounded-lg border border-site-border bg-site-bg px-4 py-2 text-sm text-site-text placeholder:text-site-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy"
          />
        </div>
        <p className="text-sm text-site-muted" aria-live="polite" aria-atomic="true">
          {resultLabel}
        </p>
      </div>

      {/* Empty search state */}
      {filtered.length === 0 && q ? (
        <div className="py-20 text-center">
          <p className="text-site-muted mb-4">No parts match &ldquo;{query}&rdquo;.</p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-sm font-medium text-site-accent-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded"
          >
            Clear search
          </button>
        </div>
      ) : (
        // TODO: add pagination once the catalogue exceeds ~60 products
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
          {filtered.map((card) => {
            const soldOut = card.combinedQty === 0
            const priceLabel =
              card.minPriceCents === card.maxPriceCents
                ? formatCurrency(card.minPriceCents)
                : `from ${formatCurrency(card.minPriceCents)}`

            return (
              <li key={card.slug}>
                <Link
                  href={`/products/${card.slug}`}
                  className={`group block rounded-lg border border-site-border overflow-hidden hover:border-site-accent-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy ${soldOut ? 'opacity-60' : ''}`}
                >
                  {/* Photo */}
                  <div className="aspect-square bg-site-bg-alt overflow-hidden">
                    {card.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={card.photoUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-site-bg-alt" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h2 className="font-medium text-site-text text-sm leading-snug mb-1">
                      {card.title}
                    </h2>
                    {card.part_number && (
                      <p className="text-xs text-site-muted font-mono mb-1">
                        Part #{card.part_number}
                      </p>
                    )}
                    {card.conditionSummary && (
                      <p className="text-xs text-site-muted mb-3">{card.conditionSummary}</p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-site-text tabular-nums">
                        {priceLabel}
                      </p>
                      <span
                        className={`text-xs font-medium ${soldOut ? 'text-site-muted' : 'text-green-700'}`}
                      >
                        {soldOut ? 'Sold out' : 'In stock'}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
