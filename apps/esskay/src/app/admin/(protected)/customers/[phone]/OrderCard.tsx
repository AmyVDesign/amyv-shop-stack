'use client'

import { useState } from 'react'
import type { Database } from '@amyv/supabase/types'

type OrderRow = Database['public']['Tables']['orders']['Row']
type OrderItemRow = Database['public']['Tables']['order_items']['Row']

export type OrderWithItems = OrderRow & { order_items: OrderItemRow[] }

type ProductSnapshot = { title?: string; sku?: string; [key: string]: unknown }

const QB_LABELS: Record<string, string> = {
  pending_mom_review: 'Pending review',
  approved_for_qb: 'Approved',
  pushed_to_qb: 'Synced to QB',
}

import { formatDate } from '@/lib/format'

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function OrderCard({ order }: { order: OrderWithItems }) {
  const [expanded, setExpanded] = useState(false)
  const shortId = order.id.slice(0, 8).toUpperCase()
  const qbLabel = QB_LABELS[order.qb_status] ?? order.qb_status
  const itemCount = order.order_items.length
  const expandId = `order-items-${order.id}`

  return (
    <div className="border border-site-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-site-muted mb-1">#{shortId}</p>
          <p className="font-semibold text-site-text">{formatCents(order.total_cents)}</p>
          <p className="text-sm text-site-muted mt-0.5">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-3 flex-none">
          <span className="text-xs px-2 py-0.5 rounded-full border border-site-border text-site-muted whitespace-nowrap">
            {qbLabel}
          </span>
          {itemCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              aria-controls={expandId}
              className="text-sm text-site-accent-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded whitespace-nowrap"
            >
              {expanded ? 'Hide' : 'Items'} ({itemCount})
            </button>
          )}
        </div>
      </div>

      <div id={expandId} hidden={!expanded}>
        <ul className="mt-4 pt-4 border-t border-site-border space-y-2">
          {order.order_items.map((item) => {
            const snap = item.product_snapshot as ProductSnapshot
            return (
              <li key={item.id} className="flex items-center justify-between text-sm gap-4">
                <span className="text-site-text truncate">
                  {snap.title ?? '(unknown product)'}
                  <span className="text-site-muted ml-2">x{item.quantity}</span>
                </span>
                <span className="text-site-muted font-mono text-xs flex-none">
                  {formatCents(item.unit_price_cents)} ea
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
