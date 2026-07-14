'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Wordmark } from '@amyv/ui'
import { useCart } from '@/contexts/CartContext'

export default function CheckoutSuccessPage() {
  const { clear } = useCart()

  // Clear the cart client-side once the success page loads.
  // cartStore.clear() mutates module state; it is not a React setState call.
  useEffect(() => { clear() }, [clear])

  return (
    <div className="min-h-screen bg-site-bg">
      <header className="border-b border-site-border bg-site-bg">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Wordmark size="sm" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="font-display text-3xl font-semibold text-site-text mb-4">
          Order received
        </h1>
        <p className="text-site-muted mb-2">Thank you for your purchase.</p>
        <p className="text-site-muted mb-8">
          A confirmation email is on its way. (Email sending ships in a future update.)
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-site-accent-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded"
        >
          Back to store
        </Link>
      </main>
    </div>
  )
}
