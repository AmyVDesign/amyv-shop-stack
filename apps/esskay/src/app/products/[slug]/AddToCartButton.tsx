'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { QuantityStepper } from '@/components/QuantityStepper'

interface Props {
  productId: string
  title: string
  priceCents: number
  slug: string
  inStock: boolean
  // Available stock for this row. When > 1 a quantity stepper is shown.
  maxQty: number
}

export function AddToCartButton({ productId, title, priceCents, slug, inStock, maxQty }: Props) {
  const { add } = useCart()
  const [qty, setQty] = useState(1)
  const [notice, setNotice] = useState<string | null>(null)
  const showStepper = inStock && maxQty > 1

  if (!inStock) {
    return (
      <button
        type="button"
        disabled
        className="px-5 py-2.5 text-sm font-medium rounded-lg border border-site-border text-site-muted cursor-not-allowed"
      >
        Sold out
      </button>
    )
  }

  function handleAdd() {
    const quantity = showStepper ? qty : 1
    const result = add({ productId, title, priceCents, slug, quantity, maxQty })
    const msg = result === 'already_in_cart' ? 'Already in your cart' : 'Added to cart'
    setNotice(msg)
    setTimeout(() => setNotice(null), 2500)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-3">
        {showStepper && (
          <QuantityStepper value={qty} max={maxQty} label={title} onChange={setQty} />
        )}
        <button
          type="button"
          onClick={handleAdd}
          className="px-5 py-2.5 text-sm font-medium bg-site-accent-dark text-site-bg rounded-lg hover:bg-site-accent-navy-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy"
        >
          Add to cart
        </button>
      </div>
      {notice && (
        <p role="status" aria-live="polite" className="text-xs text-site-muted">
          {notice}
        </p>
      )}
    </div>
  )
}
