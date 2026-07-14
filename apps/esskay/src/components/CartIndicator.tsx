'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'

export function CartIndicator() {
  const { items } = useCart()
  const count = items.length
  const label = count === 0
    ? 'Cart, empty'
    : `Cart, ${count} ${count === 1 ? 'item' : 'items'}`

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="relative inline-flex items-center gap-1.5 rounded text-sm text-site-muted hover:text-site-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy"
    >
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3h2l.5 2.5M5.5 5.5L7 14h9l1.5-8.5H5.5z" />
        <circle cx="8" cy="17" r="1" />
        <circle cx="15" cy="17" r="1" />
      </svg>
      {count > 0 && (
        <span
          aria-hidden="true"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-site-accent-dark text-xs font-medium text-site-bg"
        >
          {count}
        </span>
      )}
    </Link>
  )
}
