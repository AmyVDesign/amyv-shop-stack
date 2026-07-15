'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { PublicHeader } from '@/components/PublicHeader'
import { QuantityStepper } from '@/components/QuantityStepper'
import { formatCurrency } from '@/lib/format'

export default function CartPage() {
  const { items, remove, updateQuantity } = useCart()
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set())

  const estimatedTotal = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0)

  function clearFailed(productId: string) {
    setFailedIds((prev) => {
      if (!prev.has(productId)) return prev
      const next = new Set(prev)
      next.delete(productId)
      return next
    })
  }

  async function handleCheckout() {
    setCheckingOut(true)
    setError(null)
    setFailedIds(new Set())
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      })
      const data = await res.json() as { url?: string; failedIds?: string[]; error?: string }
      if (!res.ok) {
        if (res.status === 409 && Array.isArray(data.failedIds)) {
          setFailedIds(new Set(data.failedIds))
          setError('Some items are no longer available at the requested quantity. Adjust or remove them to continue.')
        } else {
          setError(data.error ?? 'Unable to start checkout. Please try again.')
        }
        setCheckingOut(false)
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      setError('Unable to start checkout. Please try again.')
      setCheckingOut(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-site-bg">
        <PublicHeader />
        <main className="max-w-2xl mx-auto px-6 py-16 text-center">
          <p className="text-site-muted mb-6">Your cart is empty.</p>
          <Link
            href="/products"
            className="text-sm font-medium text-site-accent-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded"
          >
            Browse parts
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-site-bg">
      <PublicHeader />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl font-semibold text-site-text mb-8">Your cart</h1>

        <ul className="space-y-3 mb-8" aria-label="Cart items">
          {items.map((item) => {
            const lineTotal = item.priceCents * item.quantity
            const isFailed = failedIds.has(item.productId)
            return (
              <li
                key={item.productId}
                className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 ${isFailed ? 'border-site-danger bg-site-bg-alt' : 'border-site-border bg-site-bg-alt'}`}
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-medium text-site-text hover:text-site-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded truncate block"
                  >
                    {item.title}
                  </Link>
                  <p className="text-sm text-site-muted mt-0.5">
                    {formatCurrency(lineTotal)}
                    {item.quantity > 1 && (
                      <span className="text-xs ml-1">({formatCurrency(item.priceCents)} each)</span>
                    )}
                  </p>
                  {isFailed && (
                    <p role="alert" className="text-xs text-site-danger mt-1">
                      Not available at this quantity -- reduce or remove to continue.
                    </p>
                  )}
                </div>
                <div className="flex-none flex flex-col items-end gap-2">
                  <QuantityStepper
                    value={item.quantity}
                    max={item.maxQty}
                    label={item.title}
                    onChange={(qty) => {
                      updateQuantity(item.productId, qty)
                      clearFailed(item.productId)
                    }}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${item.title} from cart`}
                    onClick={() => {
                      remove(item.productId)
                      clearFailed(item.productId)
                    }}
                    className="text-xs text-site-muted hover:text-site-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="border-t border-site-border pt-5 mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-site-muted mb-1">
            Estimated total (excl. shipping)
          </p>
          <p className="text-2xl font-semibold text-site-text tabular-nums">
            {formatCurrency(estimatedTotal)}
          </p>
          <p className="text-xs text-site-muted mt-1">
            Final price including shipping is confirmed at checkout.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-site-danger mb-4">{error}</p>
        )}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={checkingOut || failedIds.size > 0}
          className="w-full py-3 text-sm font-medium bg-site-accent-dark text-site-bg rounded-lg hover:bg-site-accent-navy-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy disabled:opacity-50"
        >
          {checkingOut ? 'Starting checkout...' : 'Check out'}
        </button>
      </main>
    </div>
  )
}
