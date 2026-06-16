'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Table, TableHeader, TableRow, TableCell, EmptyState } from '@amyv/ui'
import { PartsTableBody } from './PartsTableBody'
import type { Part } from './PartsTableBody'

type SortKey = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'low_stock'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'oldest',     label: 'Oldest first' },
  { value: 'price_asc',  label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'low_stock',  label: 'Low stock first' },
]

const VISIBILITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'public',    label: 'Public' },
  { value: 'internal',  label: 'Internal' },
  { value: 'ebay_only', label: 'eBay only' },
]

const CONDITION_OPTIONS: { value: string; label: string }[] = [
  { value: 'new',         label: 'New' },
  { value: 'used',        label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' },
]

const CONDITION_MAP: Record<string, string[]> = {
  new:         ['new', 'nos'],
  used:        ['used_good', 'used_fair'],
  refurbished: ['needs_rebuild', 'parts_only'],
}

function ChevronDown() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 4l4 4 4-4" />
    </svg>
  )
}

// ── Multi-select dropdown (Visibility, Condition, Vendor) ─────────────────────

function MultiFilterDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const [open, setOpen]               = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef    = useRef<HTMLButtonElement>(null)

  const isAll      = selected.length === 0
  const hasActive  = selected.length > 0
  const buttonLabel = hasActive ? `${label} (${selected.length})` : label

  // close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function onPanelKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      buttonRef.current?.focus()
    }
  }

  function toggleAll() {
    onChange([])
    setAnnouncement(`${label}: all`)
  }

  function toggleOption(value: string) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]
    onChange(next)
    setAnnouncement(next.length === 0 ? `${label}: all` : `${label}: ${next.length} selected`)
  }

  return (
    <div ref={containerRef} className="relative">
      <span className="sr-only" aria-live="polite">{announcement}</span>

      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
        className={[
          'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors whitespace-nowrap',
          hasActive
            ? 'border-site-accent-navy bg-site-accent-azure-light/40 text-site-accent-navy'
            : 'border-site-border bg-white text-site-text hover:border-site-accent-azure-dark hover:bg-site-accent-azure-light/40',
        ].join(' ')}
      >
        {buttonLabel}
        <ChevronDown />
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          onKeyDown={onPanelKeyDown}
          className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-site-border bg-white py-1 shadow-lg"
        >
          <label className="flex cursor-pointer select-none items-center gap-2.5 px-3 py-2 text-sm hover:bg-site-bg">
            <input
              type="checkbox"
              checked={isAll}
              onChange={toggleAll}
              className="[accent-color:var(--site-accent-azure-dark)]"
            />
            All
          </label>

          <div className="my-1 border-t border-site-border" />

          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer select-none items-center gap-2.5 px-3 py-2 text-sm hover:bg-site-bg"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggleOption(opt.value)}
                className="[accent-color:var(--site-accent-azure-dark)]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Single-select dropdown (Sort) ─────────────────────────────────────────────

function SortDropdown({
  options,
  value,
  onChange,
}: {
  options: { value: SortKey; label: string }[]
  value: SortKey
  onChange: (v: SortKey) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef    = useRef<HTMLDivElement>(null)
  const buttonRef       = useRef<HTMLButtonElement>(null)

  const currentLabel = options.find((o) => o.value === value)?.label ?? 'Sort by'

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function onPanelKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      buttonRef.current?.focus()
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
        className="inline-flex items-center gap-1.5 rounded-xl border border-site-border bg-white px-3 py-2 text-sm text-site-text hover:border-site-accent-azure-dark hover:bg-site-accent-azure-light/40 transition-colors whitespace-nowrap"
      >
        {currentLabel}
        <ChevronDown />
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="false"
          aria-label="Sort by"
          onKeyDown={onPanelKeyDown}
          className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border border-site-border bg-white py-1 shadow-lg"
        >
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer select-none items-center gap-2.5 px-3 py-2 text-sm hover:bg-site-bg"
            >
              <input
                type="radio"
                name="parts-sort"
                value={opt.value}
                checked={value === opt.value}
                onChange={() => { onChange(opt.value); setOpen(false) }}
                className="[accent-color:var(--site-accent-azure-dark)]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PartsClient({ parts }: { parts: Part[] }) {
  const [query, setQuery]                   = useState('')
  const [debouncedQuery, setDebounced]       = useState('')
  const [visSelected, setVisSelected]        = useState<string[]>([])
  const [condSelected, setCondSelected]      = useState<string[]>([])
  const [vendorSelected, setVendorSelected]  = useState<string[]>([])
  const [sort, setSort]                      = useState<SortKey>('newest')

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
      .map(([v]) => ({ value: v, label: v }))
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

    if (visSelected.length > 0) {
      r = r.filter((p) => visSelected.includes(p.visibility))
    }

    if (condSelected.length > 0) {
      const allowed = condSelected.flatMap((g) => CONDITION_MAP[g] ?? [])
      r = r.filter((p) => p.condition !== null && allowed.includes(p.condition))
    }

    if (vendorSelected.length > 0) {
      r = r.filter((p) => p.vendor !== null && vendorSelected.includes(p.vendor))
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
  }, [parts, debouncedQuery, visSelected, condSelected, vendorSelected, sort])

  if (parts.length === 0) {
    return (
      <EmptyState
        message={<>No parts yet. Click <strong>Add Part</strong> to create your first one.</>}
      />
    )
  }

  const hasFilters =
    visSelected.length > 0 || condSelected.length > 0 || vendorSelected.length > 0 || debouncedQuery !== ''

  return (
    <div>
      {/* Control bar: search + filter dropdowns + sort */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="search"
          aria-label="Search parts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by part number, vendor, or title"
          className="w-full sm:w-[360px] rounded-xl border border-site-border bg-white px-3 py-2 text-sm text-site-text placeholder:text-site-muted focus:outline-none focus:ring-2 focus:ring-site-accent-navy"
        />
        <MultiFilterDropdown
          label="Visibility"
          options={VISIBILITY_OPTIONS}
          selected={visSelected}
          onChange={setVisSelected}
        />
        <MultiFilterDropdown
          label="Condition"
          options={CONDITION_OPTIONS}
          selected={condSelected}
          onChange={setCondSelected}
        />
        <MultiFilterDropdown
          label="Vendor"
          options={topVendors}
          selected={vendorSelected}
          onChange={setVendorSelected}
        />
        <SortDropdown options={SORT_OPTIONS} value={sort} onChange={setSort} />
      </div>

      {/* Result count */}
      <p aria-live="polite" className="text-xs text-site-muted mb-4">
        Showing {filtered.length} of {parts.length} parts
      </p>

      {/* Table or empty-filter state */}
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-site-muted">
          No parts match{hasFilters ? ' your filters' : ''}.
        </p>
      ) : (
        <div className="rounded-xl border border-site-border overflow-hidden">
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
