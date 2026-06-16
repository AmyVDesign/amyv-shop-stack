'use client'

import { useState, useEffect, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

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

interface FilterDropdownProps {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (values: string[]) => void
}

export function FilterDropdown({ label, options, selected, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef    = useRef<HTMLButtonElement>(null)

  const isAll     = selected.length === 0
  const hasActive = selected.length > 0
  const buttonLabel = hasActive ? `${label} (${selected.length})` : label

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
        aria-haspopup="true"
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
