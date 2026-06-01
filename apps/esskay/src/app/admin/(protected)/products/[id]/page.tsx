import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge, Table, TableHeader, TableRow, TableCell } from '@amyv/ui'
import { VariantsTable } from './VariantsTable'
import type { VariantRow } from './VariantsTable'
import type { ProductCondition } from '@/lib/product-labels'

type Visibility = 'public' | 'internal' | 'ebay_only'

const visibilityBadge: Record<Visibility, { variant: 'green' | 'gray' | 'orange'; label: string }> = {
  public:    { variant: 'green',  label: 'Public'    },
  internal:  { variant: 'gray',   label: 'Internal'  },
  ebay_only: { variant: 'orange', label: 'eBay Only' },
}

const SELECT =
  'id, title, sku, part_number, manufacturer, condition, price_cents, qty_on_hand, qty_for_sale, visibility, description, photo_urls, linked_listing_id'

export default async function PartDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams])
  const supabase = await createClient()

  const { data: product, error: productError } = await supabase
    .from('products')
    .select(SELECT)
    .eq('id', id)
    .single()

  if (productError || !product) {
    console.error('[part detail] query failed:', productError)
    notFound()
  }

  // Canonical redirect: child listings forward to their parent's page
  if (product.linked_listing_id) {
    redirect(`/admin/products/${product.linked_listing_id}`)
  }

  // Fetch all listings linked to this canonical product
  const { data: children } = await supabase
    .from('products')
    .select(SELECT)
    .eq('linked_listing_id', id)
    .order('created_at', { ascending: true })

  // Parent is always first (oldest / canonical)
  const variants: VariantRow[] = [product, ...(children ?? [])].map((p) => ({
    id: p.id,
    title: p.title,
    sku: p.sku,
    part_number: p.part_number,
    manufacturer: p.manufacturer,
    condition: p.condition as ProductCondition | null,
    price_cents: p.price_cents,
    qty_on_hand: p.qty_on_hand,
    qty_for_sale: p.qty_for_sale,
    visibility: p.visibility as Visibility,
    description: p.description,
    photo_urls: p.photo_urls,
    linked_listing_id: p.linked_listing_id,
  }))

  const badge = visibilityBadge[product.visibility as Visibility]

  return (
    <div className="px-6 py-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-site-accent-dark hover:underline">
          ← Parts
        </Link>
      </div>

      {error === 'save_failed' && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          Failed to save changes. Check server logs.
        </div>
      )}

      {/* Canonical product info card */}
      <div className="flex gap-6 items-start mb-10">
        {product.photo_urls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.photo_urls[0]}
            alt={product.title}
            className="flex-none w-60 h-60 object-cover rounded-lg border border-site-border"
          />
        ) : (
          <div className="flex-none w-60 h-60 rounded-lg bg-[#f8f5f0] border border-site-border" />
        )}
        <div className="space-y-2 pt-2">
          <h1 className="text-2xl font-display font-semibold text-site-text">{product.title}</h1>
          {product.part_number && (
            <p className="font-mono text-sm text-site-muted">{product.part_number}</p>
          )}
          {product.manufacturer && (
            <p className="text-sm text-site-muted">{product.manufacturer}</p>
          )}
          <div className="pt-1">
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
        </div>
      </div>

      {/* Variants / listings table */}
      <h2 className="text-lg font-display font-semibold text-site-text mb-4">
        Listings ({variants.length})
      </h2>
      <div className="rounded-lg border border-site-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-0">
              <TableCell header>Photo</TableCell>
              <TableCell header>Condition</TableCell>
              <TableCell header>Price</TableCell>
              <TableCell header>Qty</TableCell>
              <TableCell header>Visibility</TableCell>
              <TableCell header />
            </TableRow>
          </TableHeader>
          <VariantsTable variants={variants} canonicalId={id} />
        </Table>
      </div>
    </div>
  )
}
