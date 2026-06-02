'use client'

import { Fragment, useState } from 'react'
import { Badge, Table, TableHeader, TableRow, TableCell } from '@amyv/ui'
import { conditionLabel } from '@/lib/product-labels'
import { EditListingModal } from './EditListingModal'
import type { ProductFormValues } from '../ProductForm'

type Visibility = 'public' | 'internal' | 'ebay_only'

export interface VariantRow extends ProductFormValues {
  id: string
}

interface InventoryEvent {
  id: string
  product_id: string
  event_date: string
  qty_on_hand_delta: number
  qty_for_sale_delta: number
  note: string | null
}

const visibilityBadge: Record<Visibility, { variant: 'green' | 'gray' | 'orange'; label: string }> = {
  public:    { variant: 'green',  label: 'Public'    },
  internal:  { variant: 'gray',   label: 'Internal'  },
  ebay_only: { variant: 'orange', label: 'eBay Only' },
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatEventDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

function deltaLabel(n: number) {
  return n > 0 ? `+${n}` : String(n)
}

export function VariantsTable({
  variants,
  canonicalId,
  events,
}: {
  variants: VariantRow[]
  canonicalId: string
  events: InventoryEvent[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const editingVariant = variants.find((v) => v.id === editingId) ?? null

  const eventsByProduct = new Map<string, InventoryEvent[]>()
  for (const e of events) {
    const list = eventsByProduct.get(e.product_id) ?? []
    list.push(e)
    eventsByProduct.set(e.product_id, list)
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Modal renders as a fragment sibling of the table wrapper — never inside <table>
  return (
    <>
      <div className="rounded-lg border border-site-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-0">
              <TableCell header>Photo</TableCell>
              <TableCell header>Title</TableCell>
              <TableCell header>Condition</TableCell>
              <TableCell header>Price</TableCell>
              <TableCell header className="text-right">On Hand</TableCell>
              <TableCell header className="text-right">For Sale</TableCell>
              <TableCell header className="text-right">Sold</TableCell>
              <TableCell header>Visibility</TableCell>
              <TableCell header />
            </TableRow>
          </TableHeader>
          <tbody>
            {variants.map((variant) => {
              const badge = visibilityBadge[variant.visibility]
              const variantEvents = eventsByProduct.get(variant.id) ?? []
              const hasEvents = variantEvents.length > 0
              const isExpanded = expandedIds.has(variant.id)

              return (
                <Fragment key={variant.id}>
                  <TableRow className="hover:bg-site-bg/60 transition-colors">
                    {/* Photo + chevron */}
                    <TableCell className="w-20">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 flex-none">
                          {hasEvents && (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(variant.id)}
                              className="text-site-muted hover:text-site-text transition-colors leading-none text-xs"
                              aria-label={isExpanded ? 'Collapse history' : 'Expand history'}
                            >
                              {isExpanded ? '▾' : '▸'}
                            </button>
                          )}
                        </div>
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
                      </div>
                    </TableCell>

                    {/* Title */}
                    <TableCell>
                      <span className="text-sm text-site-text">{variant.title}</span>
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

                    {/* On Hand */}
                    <TableCell className="tabular-nums text-sm text-site-muted text-right">
                      {variant.qty_on_hand}
                    </TableCell>

                    {/* For Sale */}
                    <TableCell className="tabular-nums text-sm text-site-muted text-right">
                      {variant.qty_for_sale}
                    </TableCell>

                    {/* TODO: when orders are implemented, sum qty from order_line_items where product_id = variant.id */}
                    <TableCell className="tabular-nums text-sm text-site-muted text-right">
                      0
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

                  {isExpanded && (
                    <tr className="bg-site-bg">
                      <td colSpan={9} className="px-6 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-site-muted mb-3">
                          Inventory history
                        </p>
                        <table className="w-full text-xs text-site-muted">
                          <thead>
                            <tr className="border-b border-site-border">
                              <th className="text-left pb-1.5 font-medium">Date</th>
                              <th className="text-right pb-1.5 font-medium">For Sale +</th>
                              <th className="text-right pb-1.5 font-medium">On Hand +</th>
                              <th className="text-left pb-1.5 font-medium pl-4">Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            {variantEvents.map((e) => (
                              <tr key={e.id} className="border-b border-site-border/50 last:border-0">
                                <td className="py-1.5">{formatEventDate(e.event_date)}</td>
                                <td className="py-1.5 text-right tabular-nums">{deltaLabel(e.qty_for_sale_delta)}</td>
                                <td className="py-1.5 text-right tabular-nums">{deltaLabel(e.qty_on_hand_delta)}</td>
                                <td className="py-1.5 pl-4">{e.note ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </Table>
      </div>

      {editingVariant && (
        <EditListingModal
          listing={editingVariant}
          canonicalId={canonicalId}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  )
}
