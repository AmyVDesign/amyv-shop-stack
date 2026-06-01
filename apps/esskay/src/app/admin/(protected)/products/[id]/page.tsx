import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge, Table, TableHeader, TableRow, TableCell, EmptyState } from '@amyv/ui'
import { RelatedListingsTableBody } from './RelatedListingsTableBody'
import { conditionLabel, type ProductCondition } from '@/lib/product-labels'

type Visibility = 'public' | 'internal' | 'ebay_only'
type Source = 'manual' | 'shopify_import' | 'sheets_import'

const visibilityBadge: Record<Visibility, { variant: 'green' | 'gray' | 'orange'; label: string }> = {
  public:    { variant: 'green',  label: 'Public'    },
  internal:  { variant: 'gray',   label: 'Internal'  },
  ebay_only: { variant: 'orange', label: 'eBay Only' },
}

const sourceLabel: Record<Source, string> = {
  manual:         'Manual',
  shopify_import: 'Shopify import',
  sheets_import:  'Sheets import',
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export default async function PartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: part, error: partError } = await supabase
    .from('products')
    .select(
      'id, title, sku, part_number, manufacturer, photo_urls, price_cents, qty_on_hand, qty_for_sale, visibility, source, condition, description, acquired_date'
    )
    .eq('id', id)
    .single()

  if (partError || !part) {
    console.error('[part detail] query failed:', partError)
    notFound()
  }

  const badge = visibilityBadge[part.visibility as Visibility]
  const canMatchRelated = Boolean(part.part_number && part.manufacturer)

  const details: [string, string][] = [
    ['Part Number', part.part_number ?? '—'],
    ['Manufacturer', part.manufacturer ?? '—'],
    ['Condition', part.condition ? conditionLabel[part.condition as ProductCondition] : '—'],
    ['Price', formatPrice(part.price_cents)],
    ['For Sale', String(part.qty_for_sale)],
    ['On Hand', String(part.qty_on_hand)],
    ['Source', sourceLabel[part.source as Source] ?? part.source],
  ]
  if (part.acquired_date) details.push(['Acquired', part.acquired_date])
  if (part.description) details.push(['Notes', part.description])

  type RelatedListing = {
    id: string
    title: string
    sku: string
    visibility: Visibility
    price_cents: number
    qty_on_hand: number
    qty_for_sale: number
    source: Source
    condition: ProductCondition | null
  }

  let related: RelatedListing[] = []
  let relatedFailed = false

  if (canMatchRelated) {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, sku, visibility, price_cents, qty_on_hand, qty_for_sale, source, condition')
      .eq('part_number', part.part_number!)
      .eq('manufacturer', part.manufacturer!)
      .neq('id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[part detail] related listings query failed:', error)
      relatedFailed = true
    } else {
      related = (data ?? []) as RelatedListing[]
    }
  }

  return (
    <div className="px-6 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/admin/products"
          className="text-sm text-site-accent-dark hover:underline"
        >
          ← Parts
        </Link>
        <Link
          href={`/admin/products/${part.id}/edit`}
          className="rounded font-body font-medium transition-colors text-sm px-4 py-2 bg-site-bg border border-site-accent-dark text-site-accent-dark hover:bg-site-accent-light"
        >
          Edit
        </Link>
      </div>

      {/* Part header */}
      <div className="flex items-start gap-5 mb-8">
        {part.photo_urls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={part.photo_urls[0]}
            alt={part.title}
            width={96}
            height={96}
            className="flex-none w-24 h-24 object-cover rounded-lg border border-site-border"
          />
        ) : (
          <div className="flex-none w-24 h-24 rounded-lg bg-site-border" />
        )}
        <div>
          <h1 className="text-2xl font-display font-semibold text-site-text mb-2">{part.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <span className="font-mono text-xs text-site-muted">{part.sku}</span>
          </div>
        </div>
      </div>

      {/* Detail grid */}
      <div className="rounded-lg border border-site-border overflow-hidden mb-10">
        <dl className="divide-y divide-site-border">
          {details.map(([label, value]) => (
            <div key={label} className="grid grid-cols-3 px-4 py-3 text-sm bg-white">
              <dt className="text-site-muted font-medium">{label}</dt>
              <dd className="col-span-2 text-site-text">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Related listings */}
      <h2 className="text-lg font-display font-semibold text-site-text mb-4">Related Listings</h2>

      {!canMatchRelated ? (
        <EmptyState
          message="No part number or manufacturer on this listing — related parts can't be matched."
          className="py-10"
        />
      ) : relatedFailed ? (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load related listings. Check server logs.
        </div>
      ) : related.length === 0 ? (
        <EmptyState
          message="No other listings of this part yet."
          className="py-10"
        />
      ) : (
        <div className="rounded-lg border border-site-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-0">
                <TableCell header>SKU</TableCell>
                <TableCell header>Title</TableCell>
                <TableCell header>Visibility</TableCell>
                <TableCell header>Condition</TableCell>
                <TableCell header className="text-right">For Sale</TableCell>
                <TableCell header className="text-right">On Hand</TableCell>
                <TableCell header>Price</TableCell>
                <TableCell header>Source</TableCell>
              </TableRow>
            </TableHeader>
            <RelatedListingsTableBody listings={related} />
          </Table>
        </div>
      )}
    </div>
  )
}
