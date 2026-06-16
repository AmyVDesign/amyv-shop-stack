'use client'

import { useState, useRef, useEffect } from 'react'
import { MARINE_CATEGORIES } from '@/data/marine-categories'

export interface CategoryValue {
  id: string    // google_category_id
  path: string  // google_category_path
  label: string // user-facing curated label
}

interface Props {
  id?: string
  value: CategoryValue | null
  onChange: (value: CategoryValue | null) => void
  required?: boolean
  disabled?: boolean
}

const inputClass =
  'w-full rounded border border-site-border bg-white px-3 py-1.5 text-sm text-site-text focus:outline-none focus:ring-1 focus:ring-site-accent'

export function CategoryCombobox({ id, value, onChange, disabled }: Props) {
  const [query, setQuery] = useState(value?.label ?? '')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Keep query in sync with external value when dropdown is closed
  useEffect(() => {
    if (!open) setQuery(value?.label ?? '')
  }, [value, open])

  // Show all categories when query is empty; filter by label otherwise
  const filtered =
    query.trim().length === 0
      ? MARINE_CATEGORIES
      : MARINE_CATEGORIES.filter((c) =>
          c.label.toLowerCase().includes(query.toLowerCase())
        )

  // Close on click outside and revert query
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery(value?.label ?? '')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [value])

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && activeIndex >= 0) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  function select(cat: (typeof MARINE_CATEGORIES)[number]) {
    onChange({ id: cat.google_category_id, path: cat.google_category_path, label: cat.label })
    setQuery(cat.label)
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && filtered[activeIndex]) select(filtered[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery(value?.label ?? '')
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
            if (!e.target.value) onChange(null)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Select a category (e.g. Marine Oil Filters, Nautical Books)"
          className={inputClass}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
        />
        {value && !disabled && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              onChange(null)
              setQuery('')
              setOpen(false)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-site-muted hover:text-site-text text-base leading-none px-1"
            aria-label="Clear category"
          >
            ×
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded border border-site-border bg-white shadow-md"
        >
          {filtered.map((cat, i) => (
            <li
              key={cat.label}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => select(cat)}
              onMouseEnter={() => setActiveIndex(i)}
              className={[
                'px-3 py-2 cursor-pointer text-sm font-medium text-site-text',
                i === activeIndex ? 'bg-site-accent-light' : 'hover:bg-site-bg',
              ].join(' ')}
            >
              {cat.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
