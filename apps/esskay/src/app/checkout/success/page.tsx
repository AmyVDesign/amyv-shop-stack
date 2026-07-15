export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Wordmark } from '@amyv/ui'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/format'
import { CartClearer } from './CartClearer'

type ProductSnapshot = {
  title: string
  part_number: string | null
  vendor: string | null
  condition: string | null
  photo_url: string | null
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  let order: {
    id: string
    total_cents: number
    order_items: { product_snapshot: unknown; quantity: number; unit_price_cents: number }[]
  } | null = null

  if (session_id) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('orders')
      .select('id, total_cents, order_items(product_snapshot, quantity, unit_price_cents)')
      .eq('stripe_session_id', session_id)
      .maybeSingle()
    order = data ?? null
  }

  const shortId = order?.id.slice(0, 8).toUpperCase()

  return (
    <div className="min-h-screen bg-site-bg">
      <header className="border-b border-site-border bg-site-bg">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Wordmark size="sm" />
        </div>
      </header>

      <CartClearer />

      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl font-semibold text-site-text mb-4">
          Order received
        </h1>

        {order ? (
          <>
            <p className="text-site-muted mb-6">
              Thank you for your purchase. A confirmation email is on its way.
            </p>

            <p className="font-medium text-site-text mb-6">Order #{shortId}</p>

            <ul className="space-y-2 mb-4" aria-label="Order items">
              {(order.order_items ?? []).map((item, i) => {
                const snapshot = item.product_snapshot as ProductSnapshot
                const lineTotal = item.unit_price_cents * item.quantity
                return (
                  <li key={i} className="flex justify-between gap-4 text-sm">
                    <span className="text-site-text">
                      {snapshot.title}{item.quantity > 1 ? ` x${item.quantity}` : ''}
                    </span>
                    <span className="text-site-muted tabular-nums">
                      {formatCurrency(lineTotal)}
                    </span>
                  </li>
                )
              })}
            </ul>

            <div className="border-t border-site-border pt-4 mb-8 flex justify-between text-sm font-medium text-site-text">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(order.total_cents)}</span>
            </div>
          </>
        ) : (
          <p className="text-site-muted mb-8">
            Your order is confirmed. Your order number and receipt are on their way by email.
          </p>
        )}

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
