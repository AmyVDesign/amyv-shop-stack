'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'

interface Props {
  productId: string
  title: string
  priceCents: number
  slug: string
  inStock: boolean
}

export function AddToCartButton({ productId, title, priceCents, slug, inStock }: Props) {
  const { add } = useCart()
  const [notice, setNotice] = useState<string | null>(null)

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
    const result = add({ productId, title, priceCents, slug })
    const msg = result === 'already_in_cart' ? 'Already in your cart' : 'Added to cart'
    setNotice(msg)
    setTimeout(() => setNotice(null), 2500)
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={handleAdd}
        className="px-5 py-2.5 text-sm font-medium bg-site-accent-dark text-site-bg rounded-lg hover:bg-site-accent-navy-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy"
      >
        Add to cart
      </button>
      {notice && (
        <p role="status" aria-live="polite" className="text-xs text-site-muted">
          {notice}
        </p>
      )}
    </div>
  )
}
