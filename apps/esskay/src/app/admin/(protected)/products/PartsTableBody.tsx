'use client'

import { useRouter } from 'next/navigation'
import { TableRow, TableCell } from '@amyv/ui'
import { conditionLabel } from '@/lib/product-labels'
import type { ProductCondition } from '@/lib/product-labels'
import { formatDateAdded } from '@/lib/format'

type Visibility = 'public' | 'internal' | 'ebay_only'

export interface Part {
  id: string
  title: string
  sku: string
  part_number: string | null
  vendor: string | null
  condition: ProductCondition | null
  photo_urls: string[]
  price_cents: number
  qty_on_hand: number
  qty_for_sale: number
  visibility: Visibility
  linked_listing_id: string | null
  created_at: string
  category_label: string | null
}

// Badge text uses navy (#0F3A57) on all tinted bgs — accent-dark values fail 4.5:1 on their light pairs
const visibilityBadge: Record<Visibility, { className: string; label: string }> = {
  public:    { className: 'bg-site-accent-azure-light text-site-accent-navy',       label: 'Public'    },
  internal:  { className: 'bg-site-accent-driftwood-light text-site-accent-navy',    label: 'Internal'  },
  ebay_only: { className: 'bg-site-accent-coral-light text-site-accent-navy',        label: 'eBay Only' },
}

function conditionStyles(condition: ProductCondition): string {
  if (condition === 'new' || condition === 'nos')
    return 'bg-site-accent-azure-light text-site-accent-navy'
  if (condition === 'used_good' || condition === 'used_fair')
    return 'bg-gray-100 text-gray-700'
  return 'bg-site-accent-driftwood-light text-site-accent-navy'
}

function ConditionBadge({ condition }: { condition: ProductCondition | null }) {
  if (!condition) return <span className="text-site-muted">&mdash;</span>
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${conditionStyles(condition)}`}>
      {conditionLabel[condition]}
    </span>
  )
}

function StockDot({ qty }: { qty: number }) {
  if (qty === 0) {
    return (
      <svg aria-hidden="true" width="8" height="8" viewBox="0 0 8 8" className="inline-block mr-1 align-middle text-red-500">
        <circle cx="4" cy="4" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }
  if (qty <= 5) {
    return (
      <svg aria-hidden="true" width="8" height="8" viewBox="0 0 8 8" className="inline-block mr-1 align-middle text-amber-700">
        <path d="M4 1A3 3 0 0 1 4 7Z" fill="currentColor" />
        <circle cx="4" cy="4" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }
  return (
    <svg aria-hidden="true" width="8" height="8" viewBox="0 0 8 8" className="inline-block mr-1 align-middle text-green-600">
      <circle cx="4" cy="4" r="3.5" fill="currentColor" />
    </svg>
  )
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export function PartsTableBody({ parts }: { parts: Part[] }) {
  const router = useRouter()

  if (parts.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={10} className="py-16 text-center text-sm text-site-muted">
            No parts found.
          </td>
        </tr>
      </tbody>
    )
  }

  return (
    <tbody>
      {parts.map((part) => {
        const badge = visibilityBadge[part.visibility]
        return (
          <TableRow
            key={part.id}
            onClick={() => router.push(`/admin/products/${part.linked_listing_id ?? part.id}`)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/admin/products/${part.linked_listing_id ?? part.id}`) }}
            tabIndex={0}
            className="cursor-pointer hover:bg-site-bg/60 transition-colors"
          >
            {/* Photo */}
            <TableCell className="w-14">
              {part.photo_urls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={part.photo_urls[0]}
                  alt={part.title}
                  width={40}
                  height={40}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-site-border" />
              )}
            </TableCell>

            {/* Date Added */}
            <TableCell>
              <span className="text-site-muted">{formatDateAdded(part.created_at)}</span>
            </TableCell>

            {/* SKU */}
            <TableCell>
              <span className="font-mono text-xs text-site-muted">{part.sku}</span>
            </TableCell>

            {/* Part Number */}
            <TableCell>
              <span className="text-site-muted">{part.part_number ?? '\u2014'}</span>
            </TableCell>

            {/* Vendor */}
            <TableCell>
              <span className="text-site-muted">{part.vendor ?? '\u2014'}</span>
            </TableCell>

            {/* Condition */}
            <TableCell>
              <ConditionBadge condition={part.condition} />
            </TableCell>

            {/* Visibility */}
            <TableCell>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                {badge.label}
              </span>
            </TableCell>

            {/* For Sale */}
            <TableCell className="tabular-nums text-right">
              {part.qty_for_sale}
            </TableCell>

            {/* On Hand */}
            <TableCell className="tabular-nums">
              <span className="inline-flex items-center gap-1">
                <StockDot qty={part.qty_on_hand} />
                {part.qty_on_hand}
              </span>
            </TableCell>

            {/* Price */}
            <TableCell className="tabular-nums">
              {formatPrice(part.price_cents)}
            </TableCell>
          </TableRow>
        )
      })}
    </tbody>
  )
}
