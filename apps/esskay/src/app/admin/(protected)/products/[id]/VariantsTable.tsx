'use client'

import { Fragment, useState } from 'react'
import { Table, TableHeader, TableRow, TableCell } from '@amyv/ui'
import { conditionLabel } from '@/lib/product-labels'
import { formatDate } from '@/lib/format'
import { EditListingModal } from './EditListingModal'
import type { ProductFormValues } from '../ProductForm'

type Visibility = 'public' | 'internal' | 'ebay_only'

export interface VariantRow extends ProductFormValues {
  id: string
  created_at: string
}

interface InventoryEvent {
  id: string
  product_id: string
  event_date: string
  qty_on_hand_delta: number
  qty_for_sale_delta: number
  note: string | null
}

interface Batch {
  date: string
  onHandAdded: number
  forSaleAdded: number
  note: string | null
}

// Badge text uses navy (#0F3A57) on all tinted bgs — accent-dark values fail 4.5:1 on their light pairs
const visibilityBadge: Record<Visibility, { className: string; label: string }> = {
  public:    { className: 'bg-site-accent-azure-light text-site-accent-navy',       label: 'Public'    },
  internal:  { className: 'bg-site-accent-driftwood-light text-site-accent-navy',    label: 'Internal'  },
  ebay_only: { className: 'bg-site-accent-coral-light text-site-accent-navy',        label: 'eBay Only' },
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function deltaLabel(n: number) {
  return n > 0 ? `+${n}` : String(n)
}

function conditionBadgeClass(condition: string): string {
  if (condition === 'new' || condition === 'nos')
    return 'bg-site-accent-azure-light text-site-accent-navy'
  if (condition === 'used_good' || condition === 'used_fair')
    return 'bg-site-bg text-site-text'
  return 'bg-site-accent-driftwood-light text-site-accent-navy'
}

const NEW_AGG_KEY = 'new-aggregate'

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

  function toggleExpanded(key: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Group new-condition variants into one aggregate row
  const newVariants = variants.filter((v) => v.condition === 'new')
  const otherVariants = variants.filter((v) => v.condition !== 'new')
  const sortedNew = [...newVariants].sort((a, b) => b.price_cents - a.price_cents)
  const keeper = sortedNew[0] ?? null

  // Build unified batch list for the "New" accordion
  const allBatches: Batch[] = keeper
    ? [
        ...(eventsByProduct.get(keeper.id) ?? []).map((e) => ({
          date: e.event_date,
          onHandAdded: e.qty_on_hand_delta,
          forSaleAdded: e.qty_for_sale_delta,
          note: e.note,
        })),
        ...newVariants
          .filter((v) => v.id !== keeper.id)
          .map((v) => ({
            date: v.created_at,
            onHandAdded: v.qty_on_hand,
            forSaleAdded: v.qty_for_sale,
            note: 'Added as separate listing',
          })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : []

  const newTotalOnHand = newVariants.reduce((sum, v) => sum + v.qty_on_hand, 0)
  const newTotalForSale = newVariants.reduce((sum, v) => sum + v.qty_for_sale, 0)
  const newVisibilities = [...new Set(newVariants.map((v) => v.visibility))]
  const newIsExpanded = expandedIds.has(NEW_AGG_KEY)

  // Modal renders as a fragment sibling of the table wrapper — never inside <table>
  return (
    <>
      <div className="rounded-lg border border-site-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-0">
              <TableCell header>Photo</TableCell>
              <TableCell header>Title</TableCell>
              <TableCell header>Date Added</TableCell>
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
            {/* ── Aggregate "New" row ─────────────────────────────── */}
            {keeper && (
              <Fragment key={NEW_AGG_KEY}>
                <TableRow className="hover:bg-site-bg/60 transition-colors">
                  <TableCell className="w-20">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 flex-none">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(NEW_AGG_KEY)}
                          className="text-site-muted hover:text-site-text transition-colors leading-none text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded"
                          aria-label={newIsExpanded ? 'Collapse batches' : 'Expand batches'}
                        >
                          {newIsExpanded ? '▾' : '▸'}
                        </button>
                      </div>
                      {keeper.photo_urls[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={keeper.photo_urls[0]}
                          alt="New condition"
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded border border-site-border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-site-bg border border-site-border" />
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm text-site-text">{keeper.title}</span>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm text-site-muted">--</span>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-site-accent-azure-light text-site-accent-navy">New</span>
                  </TableCell>

                  <TableCell className="tabular-nums text-sm">
                    {formatPrice(keeper.price_cents)}
                  </TableCell>

                  <TableCell className="tabular-nums text-sm text-site-muted text-right">
                    {newTotalOnHand}
                  </TableCell>

                  <TableCell className="tabular-nums text-sm text-site-muted text-right">
                    {newTotalForSale}
                  </TableCell>

                  <TableCell className="tabular-nums text-sm text-site-muted text-right">
                    0
                  </TableCell>

                  <TableCell>
                    {newVisibilities.length === 1 ? (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${visibilityBadge[newVisibilities[0] as Visibility].className}`}>
                        {visibilityBadge[newVisibilities[0] as Visibility].label}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-site-bg text-site-text">Mixed</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setEditingId(keeper.id)}
                      className="rounded text-xs font-medium px-3 py-1 border border-site-accent-navy text-site-accent-navy hover:bg-site-accent-azure-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy"
                    >
                      Edit
                    </button>
                  </TableCell>
                </TableRow>

                {newIsExpanded && (
                  <tr className="bg-site-bg">
                    <td colSpan={10} className="px-6 py-4">
                      <p className="text-xs font-medium uppercase text-site-muted mb-3" style={{ letterSpacing: 'var(--label-tracking)' }}>
                        Inventory batches
                      </p>
                      {allBatches.length === 0 ? (
                        <p className="text-xs text-site-muted">No batch history recorded.</p>
                      ) : (
                        <table className="w-full text-xs text-site-muted">
                          <thead>
                            <tr className="border-b border-site-border">
                              <th scope="col" className="text-left pb-1.5 font-medium">Date</th>
                              <th scope="col" className="text-right pb-1.5 font-medium">On Hand +</th>
                              <th scope="col" className="text-right pb-1.5 font-medium">For Sale +</th>
                              <th scope="col" className="text-left pb-1.5 font-medium pl-4">Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allBatches.map((b, i) => (
                              // eslint-disable-next-line react/no-array-index-key
                              <tr key={i} className="border-b border-site-border/50 last:border-0">
                                <td className="py-1.5">{formatDate(b.date)}</td>
                                <td className="py-1.5 text-right tabular-nums">{deltaLabel(b.onHandAdded)}</td>
                                <td className="py-1.5 text-right tabular-nums">{deltaLabel(b.forSaleAdded)}</td>
                                <td className="py-1.5 pl-4">{b.note}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            )}

            {/* ── Individual non-new rows ─────────────────────────── */}
            {otherVariants.map((variant) => {
              const badge = visibilityBadge[variant.visibility]
              const variantEvents = eventsByProduct.get(variant.id) ?? []
              const hasEvents = variantEvents.length > 0
              const isExpanded = expandedIds.has(variant.id)

              return (
                <Fragment key={variant.id}>
                  <TableRow className="hover:bg-site-bg/60 transition-colors">
                    <TableCell className="w-20">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 flex-none">
                          {hasEvents && (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(variant.id)}
                              className="text-site-muted hover:text-site-text transition-colors leading-none text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded"
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
                          <div className="w-12 h-12 rounded bg-site-bg border border-site-border" />
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-site-text">{variant.title}</span>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-site-muted">{formatDate(variant.created_at)}</span>
                    </TableCell>

                    <TableCell>
                      {variant.condition ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${conditionBadgeClass(variant.condition)}`}>
                          {conditionLabel[variant.condition]}
                        </span>
                      ) : null}
                    </TableCell>

                    <TableCell className="tabular-nums text-sm">
                      {formatPrice(variant.price_cents)}
                    </TableCell>

                    <TableCell className="tabular-nums text-sm text-site-muted text-right">
                      {variant.qty_on_hand}
                    </TableCell>

                    <TableCell className="tabular-nums text-sm text-site-muted text-right">
                      {variant.qty_for_sale}
                    </TableCell>

                    <TableCell className="tabular-nums text-sm text-site-muted text-right">
                      0
                    </TableCell>

                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </TableCell>

                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setEditingId(variant.id)}
                        className="rounded text-xs font-medium px-3 py-1 border border-site-accent-navy text-site-accent-navy hover:bg-site-accent-azure-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy"
                      >
                        Edit
                      </button>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <tr className="bg-site-bg">
                      <td colSpan={10} className="px-6 py-4">
                        <p className="text-xs font-medium uppercase text-site-muted mb-3" style={{ letterSpacing: 'var(--label-tracking)' }}>
                          Inventory history
                        </p>
                        <table className="w-full text-xs text-site-muted">
                          <thead>
                            <tr className="border-b border-site-border">
                              <th scope="col" className="text-left pb-1.5 font-medium">Date</th>
                              <th scope="col" className="text-right pb-1.5 font-medium">For Sale +</th>
                              <th scope="col" className="text-right pb-1.5 font-medium">On Hand +</th>
                              <th scope="col" className="text-left pb-1.5 font-medium pl-4">Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            {variantEvents.map((e) => (
                              <tr key={e.id} className="border-b border-site-border/50 last:border-0">
                                <td className="py-1.5">{formatDate(e.event_date)}</td>
                                <td className="py-1.5 text-right tabular-nums">{deltaLabel(e.qty_for_sale_delta)}</td>
                                <td className="py-1.5 text-right tabular-nums">{deltaLabel(e.qty_on_hand_delta)}</td>
                                <td className="py-1.5 pl-4">{e.note}</td>
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
