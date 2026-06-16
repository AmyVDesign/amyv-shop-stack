'use client'

import { useState, useEffect, useMemo } from 'react'
import { Table, TableHeader, TableRow, TableCell, EmptyState } from '@amyv/ui'
import { PartsTableBody } from './PartsTableBody'
import type { Part } from './PartsTableBody'

type SortKey = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'low_stock'
type VisibilityFilter = 'all' | 'public' | 'internal' | 'ebay_only'
type ConditionGroup = 'all' | 'new' | 'used' | 'refurbished'

const CONDITION_GROUPS: Record<Exclude<ConditionGroup, 'all'>, string[]> = {
  new:         ['new', 'nos'],
  used:        ['used_good', 'used_fair'],
  refurbished: ['needs_rebuild', 'parts_only'],
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors whitespace-nowrap',
        active
          ? 'bg-site-accent border-site-accent text-white'
          : 'bg-white border-site-border text-site-text hover:border-site-accent-light',
      ].join(' ')}
    >
      {label}
      {active && <span aria-hidden="true" className="opacity-75 leading-none">×</span>}
    </button>
  )
}

export function PartsClient({ parts }: { parts: Part[] }) {
  const [query, setQuery]             = useState('')
  const [debouncedQuery, setDebounced] = useState('')
  const [visFilter, setVisFilter]     = useState<VisibilityFilter>('all')
  const [condFilter, setCondFilter]   = useState<ConditionGroup>('all')
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [sort, setSort]               = useState<SortKey>('newest')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200)
    return () => clearTimeout(t)
  }, [query])

  const topVendors = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of parts) {
      if (p.vendor) counts.set(p.vendor, (counts.get(p.vendor) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([v]) => v)
  }, [parts])

  const filtered = useMemo(() => {
    let r = parts.slice()

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase()
      r = r.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.part_number ?? '').toLowerCase().includes(q) ||
          (p.vendor ?? '').toLowerCase().includes(q) ||
          (p.category_label ?? '').toLowerCase().includes(q)
      )
    }

    if (visFilter !== 'all') {
      r = r.filter((p) => p.visibility === visFilter)
    }

    if (condFilter !== 'all') {
      const allowed = CONDITION_GROUPS[condFilter]
      r = r.filter((p) => p.condition !== null && allowed.includes(p.condition))
    }

    if (vendorFilter !== 'all') {
      r = r.filter((p) => p.vendor === vendorFilter)
    }

    r.sort((a, b) => {
      switch (sort) {
        case 'newest':     return Date.parse(b.created_at) - Date.parse(a.created_at)
        case 'oldest':     return Date.parse(a.created_at) - Date.parse(b.created_at)
        case 'price_asc':  return a.price_cents - b.price_cents
        case 'price_desc': return b.price_cents - a.price_cents
        case 'low_stock':  return a.qty_on_hand - b.qty_on_hand
        default:           return 0
      }
    })

    return r
  }, [parts, debouncedQuery, visFilter, condFilter, vendorFilter, sort])

  if (parts.length === 0) {
    return (
      <EmptyState
        message={
          <>
            No parts yet. Click <strong>Add Part</strong> to create your first one.
          </>
        }
      />
    )
  }

  const hasActive = visFilter !== 'all' || condFilter !== 'all' || vendorFilter !== 'all' || debouncedQuery !== ''

  return (
    <div>
      {/* Search */}
      <div className="mb-3">
        <input
          type="search"
          aria-label="Search parts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by part number, vendor, or title"
          className="w-full max-w-md rounded border border-site-border bg-white px-3 py-2 text-sm text-site-text placeholder:text-site-muted focus:outline-none focus:ring-2 focus:ring-site-accent-light"
        />
      </div>

      {/* Filter chips + sort */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <FilterChip label="All" active={visFilter === 'all'} onClick={() => setVisFilter('all')} />
        <FilterChip label="Public"    active={visFilter === 'public'}    onClick={() => setVisFilter(visFilter === 'public'    ? 'all' : 'public')} />
        <FilterChip label="Internal"  active={visFilter === 'internal'}  onClick={() => setVisFilter(visFilter === 'internal'  ? 'all' : 'internal')} />
        <FilterChip label="eBay only" active={visFilter === 'ebay_only'} onClick={() => setVisFilter(visFilter === 'ebay_only' ? 'all' : 'ebay_only')} />

        <span aria-hidden="true" className="text-site-muted select-none">·</span>

        <FilterChip label="Any condition" active={condFilter === 'all'}         onClick={() => setCondFilter('all')} />
        <FilterChip label="New"           active={condFilter === 'new'}         onClick={() => setCondFilter(condFilter === 'new'         ? 'all' : 'new')} />
        <FilterChip label="Used"          active={condFilter === 'used'}        onClick={() => setCondFilter(condFilter === 'used'        ? 'all' : 'used')} />
        <FilterChip label="Refurbished"   active={condFilter === 'refurbished'} onClick={() => setCondFilter(condFilter === 'refurbished' ? 'all' : 'refurbished')} />

        {topVendors.length > 0 && (
          <>
            <span aria-hidden="true" className="text-site-muted select-none">·</span>
            <FilterChip label="Any vendor" active={vendorFilter === 'all'} onClick={() => setVendorFilter('all')} />
            {topVendors.map((v) => (
              <FilterChip
                key={v}
                label={v}
                active={vendorFilter === v}
                onClick={() => setVendorFilter(vendorFilter === v ? 'all' : v)}
              />
            ))}
          </>
        )}

        <div className="ml-auto flex-shrink-0">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort parts"
            className="rounded border border-site-border bg-white px-2 py-1.5 text-xs text-site-text focus:outline-none focus:ring-2 focus:ring-site-accent-light"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="low_stock">Low stock first</option>
          </select>
        </div>
      </div>

      {/* Result count */}
      <p aria-live="polite" className="text-xs text-site-muted mb-4">
        Showing {filtered.length} of {parts.length} parts
      </p>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-site-muted">
          No parts match{hasActive ? ' your filters' : ''}.
        </p>
      ) : (
        <div className="rounded-lg border border-site-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-0">
                <TableCell header>Photo</TableCell>
                <TableCell header>Date Added</TableCell>
                <TableCell header>SKU</TableCell>
                <TableCell header>Part No.</TableCell>
                <TableCell header>Manufacturer</TableCell>
                <TableCell header>Condition</TableCell>
                <TableCell header>Visibility</TableCell>
                <TableCell header>For Sale</TableCell>
                <TableCell header>On Hand</TableCell>
                <TableCell header>Price</TableCell>
              </TableRow>
            </TableHeader>
            <PartsTableBody parts={filtered} />
          </Table>
        </div>
      )}
    </div>
  )
}
