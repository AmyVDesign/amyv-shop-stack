'use client'

import { useState, useRef, useEffect } from 'react'
import taxonomyJson from '@/data/google-taxonomy.json'

interface TaxonomyEntry {
  id: string
  path: string
  name: string
  parent_id: string | null
}

const taxonomy = taxonomyJson as TaxonomyEntry[]

export interface CategoryValue {
  id: string
  path: string
}

interface Props {
  value: CategoryValue | null
  onChange: (value: CategoryValue | null) => void
  required?: boolean
  disabled?: boolean
}

const inputClass =
  'w-full rounded border border-site-border bg-white px-3 py-1.5 text-sm text-site-text focus:outline-none focus:ring-1 focus:ring-site-accent'

export function CategoryCombobox({ value, onChange, disabled }: Props) {
  const [query, setQuery] = useState(value?.path ?? '')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Keep query in sync with external value when dropdown is closed
  useEffect(() => {
    if (!open) setQuery(value?.path ?? '')
  }, [value, open])

  const filtered =
    query.trim().length === 0
      ? []
      : taxonomy
          .filter((e) => {
            const q = query.toLowerCase()
            return e.path.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)
          })
          .slice(0, 20)

  // Close on click outside and revert query
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery(value?.path ?? '')
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

  function select(entry: TaxonomyEntry) {
    onChange({ id: entry.id, path: entry.path })
    setQuery(entry.path)
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
      setQuery(value?.path ?? '')
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
            if (!e.target.value) onChange(null)
          }}
          onFocus={() => { if (query.trim()) setOpen(true) }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Search categories (e.g. Watercraft Parts, Books, Charts)"
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
          {filtered.map((entry, i) => {
            const segments = entry.path.split(' > ')
            const prefix = segments.length > 1 ? segments.slice(0, -1).join(' > ') : null
            return (
              <li
                key={entry.id}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={() => select(entry)}
                onMouseEnter={() => setActiveIndex(i)}
                className={[
                  'flex flex-col px-3 py-2 cursor-pointer',
                  i === activeIndex ? 'bg-site-accent-light' : 'hover:bg-site-bg',
                ].join(' ')}
              >
                <span className="text-sm font-medium text-site-text">{entry.name}</span>
                {prefix && (
                  <span className="text-xs text-site-muted truncate">{prefix}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
