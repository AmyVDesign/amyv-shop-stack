'use client'

import { useState } from 'react'
import { Badge, TableRow, TableCell } from '@amyv/ui'
import { conditionLabel } from '@/lib/product-labels'
import { EditListingModal } from './EditListingModal'
import type { ProductFormValues } from '../ProductForm'

type Visibility = 'public' | 'internal' | 'ebay_only'

export interface VariantRow extends ProductFormValues {
  id: string
}

const visibilityBadge: Record<Visibility, { variant: 'green' | 'gray' | 'orange'; label: string }> = {
  public:    { variant: 'green',  label: 'Public'    },
  internal:  { variant: 'gray',   label: 'Internal'  },
  ebay_only: { variant: 'orange', label: 'eBay Only' },
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export function VariantsTable({
  variants,
  canonicalId,
}: {
  variants: VariantRow[]
  canonicalId: string
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const editingVariant = variants.find((v) => v.id === editingId) ?? null

  return (
    <>
      {editingVariant && (
        <EditListingModal
          listing={editingVariant}
          canonicalId={canonicalId}
          onClose={() => setEditingId(null)}
        />
      )}
      <tbody>
        {variants.map((variant) => {
          const isCanonical = variant.id === canonicalId
          const badge = visibilityBadge[variant.visibility]
          return (
            <TableRow key={variant.id} className="hover:bg-site-bg/60 transition-colors">
              {/* Photo + canonical marker */}
              <TableCell className="w-16">
                <div className="relative inline-block">
                  {variant.photo_urls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={variant.photo_urls[0]}
                      alt={variant.title}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded border border-site-border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-[#f8f5f0] border border-site-border" />
                  )}
                  {isCanonical && (
                    <span
                      aria-label="Canonical listing"
                      className="absolute -top-1.5 -right-1.5 text-[10px] font-semibold bg-site-accent-dark text-white rounded px-1 leading-4"
                    >
                      C
                    </span>
                  )}
                </div>
              </TableCell>

              {/* Condition */}
              <TableCell>
                <span className="text-sm text-site-muted">
                  {variant.condition ? conditionLabel[variant.condition] : '—'}
                </span>
              </TableCell>

              {/* Price */}
              <TableCell className="tabular-nums text-sm">
                {formatPrice(variant.price_cents)}
              </TableCell>

              {/* Qty for sale / on hand */}
              <TableCell className="tabular-nums text-sm text-site-muted">
                {variant.qty_for_sale} / {variant.qty_on_hand}
              </TableCell>

              {/* Visibility */}
              <TableCell>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </TableCell>

              {/* Edit */}
              <TableCell>
                <button
                  type="button"
                  onClick={() => setEditingId(variant.id)}
                  className="rounded text-xs font-medium px-3 py-1 border border-site-accent-dark text-site-accent-dark hover:bg-site-accent-light transition-colors"
                >
                  Edit
                </button>
              </TableCell>
            </TableRow>
          )
        })}
      </tbody>
    </>
  )
}
