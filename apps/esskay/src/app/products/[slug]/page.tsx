import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Wordmark } from '@amyv/ui'
import { conditionLabel } from '@/lib/product-labels'
import type { ProductCondition } from '@/lib/product-labels'

const SELECT =
  'id, title, slug, part_number, vendor, condition, price_cents, qty_for_sale, description, condition_notes, photo_urls, linked_listing_id, standalone_listing, visibility'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

type Row = {
  id: string
  title: string
  slug: string
  part_number: string | null
  vendor: string | null
  condition: string | null
  price_cents: number
  qty_for_sale: number
  description: string | null
  condition_notes: string | null
  photo_urls: string[]
  linked_listing_id: string | null
  standalone_listing: boolean
  visibility: string
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('title, description')
    .eq('slug', slug)
    .maybeSingle()
  if (!data) return { title: 'Ess-Kay Yards' }
  return {
    title: `${data.title} — Ess-Kay Yards`,
    description: data.description ?? 'Marine parts and service. Brewerton, NY.',
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select(SELECT)
    .eq('slug', slug)
    .maybeSingle()

  // RLS filters non-public rows to null for anon; explicit check for safety
  if (!product || product.visibility !== 'public') notFound()

  // Child with standalone_listing=false → redirect to parent's storefront page
  if (product.linked_listing_id && !product.standalone_listing) {
    const { data: parent } = await supabase
      .from('products')
      .select('slug')
      .eq('id', product.linked_listing_id)
      .single()
    if (parent?.slug) redirect(`/products/${parent.slug}`)
    notFound()
  }

  // For standalone listings: single-variant layout (no grouping)
  if (product.linked_listing_id && product.standalone_listing) {
    return <StandaloneLayout product={product as Row} />
  }

  // Canonical — fetch public non-standalone children
  const { data: children } = await supabase
    .from('products')
    .select(SELECT)
    .eq('linked_listing_id', product.id)
    .eq('visibility', 'public')
    .eq('standalone_listing', false)
    .order('created_at', { ascending: true })

  const displayVariants: Row[] = [product as Row, ...(children ?? []) as Row[]]

  const newVariants = displayVariants.filter(
    (v) => v.condition === 'new' || v.condition === 'nos'
  )
  const otherVariants = displayVariants.filter(
    (v) => v.condition !== 'new' && v.condition !== 'nos'
  )

  const coverPhoto = product.photo_urls[0] ?? null

  return (
    <div className="min-h-screen bg-site-bg">
      <PublicHeader />

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="flex flex-col md:flex-row gap-10 mb-12">
          <div className="flex-none">
            {coverPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPhoto}
                alt={product.title}
                className="w-full md:w-[480px] aspect-square object-cover rounded-lg border border-site-border"
              />
            ) : (
              <div className="w-full md:w-[480px] aspect-square rounded-lg bg-white border border-site-border" />
            )}
          </div>

          <div className="flex flex-col justify-start pt-2">
            <h1 className="font-display text-4xl font-semibold text-site-text leading-tight mb-3">
              {product.title}
            </h1>
            {(product.part_number || product.vendor) && (
              <p className="text-sm text-site-muted mb-4">
                {product.part_number && (
                  <span className="font-mono">Part #{product.part_number}</span>
                )}
                {product.part_number && product.vendor && ' · '}
                {product.vendor}
              </p>
            )}
            {product.description && (
              <p className="text-base text-site-text leading-relaxed">{product.description}</p>
            )}
          </div>
        </div>

        {/* Available section */}
        <section>
          <p className="text-xs font-medium uppercase tracking-wide text-site-muted mb-4">
            Available
          </p>

          <div className="flex flex-col gap-3">
            {/* New / NOS — grouped fungible block */}
            {newVariants.length > 0 && (
              <NewGroupCard variants={newVariants} />
            )}

            {/* Non-new — individual cards */}
            {otherVariants.map((v) => (
              <OtherVariantCard key={v.id} variant={v} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function PublicHeader() {
  return (
    <header className="border-b border-site-border bg-site-bg">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <Wordmark size="sm" />
      </div>
    </header>
  )
}

function NewGroupCard({ variants }: { variants: Row[] }) {
  const totalQty = variants.reduce((sum, v) => sum + v.qty_for_sale, 0)
  const prices = variants.map((v) => v.price_cents)
  const minPrice = Math.min(...prices)
  const allSamePrice = prices.every((p) => p === minPrice)
  const priceLabel = allSamePrice ? formatPrice(minPrice) : `from ${formatPrice(minPrice)}`

  return (
    <div className="rounded-lg border border-site-border bg-white px-6 py-5 flex items-center justify-between gap-4">
      <div>
        <p className="font-display text-lg font-semibold text-site-text mb-1">New</p>
        <p className={`text-sm ${totalQty > 0 ? 'text-green-700' : 'text-site-muted'}`}>
          {totalQty > 0 ? `${totalQty} in stock` : 'Out of stock'}
        </p>
      </div>
      <p className="text-xl font-semibold text-site-text tabular-nums">{priceLabel}</p>
    </div>
  )
}

function OtherVariantCard({ variant: v }: { variant: Row }) {
  const outOfStock = v.qty_for_sale === 0
  const condLabel = v.condition
    ? conditionLabel[v.condition as ProductCondition]
    : 'Used'

  return (
    <div
      className={`rounded-lg border border-site-border bg-white flex items-center gap-5 px-5 py-4 ${outOfStock ? 'opacity-50' : ''}`}
    >
      {/* Photo */}
      <div className="flex-none">
        {v.photo_urls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.photo_urls[0]}
            alt={v.title}
            width={120}
            height={120}
            className="w-[120px] h-[120px] object-cover rounded border border-site-border"
          />
        ) : (
          <div className="w-[120px] h-[120px] rounded border border-site-border bg-site-bg" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-site-text mb-0.5">{condLabel}</p>
        {v.condition_notes && (
          <p className="text-sm text-site-muted leading-snug">{v.condition_notes}</p>
        )}
        <p className={`text-xs mt-2 font-medium ${outOfStock ? 'text-site-muted' : 'text-green-700'}`}>
          {outOfStock ? 'Out of stock' : `${v.qty_for_sale} in stock`}
        </p>
      </div>

      {/* Price */}
      <p className="flex-none text-xl font-semibold text-site-text tabular-nums">
        {formatPrice(v.price_cents)}
      </p>
    </div>
  )
}

function StandaloneLayout({ product }: { product: Row }) {
  const coverPhoto = product.photo_urls[0] ?? null

  return (
    <div className="min-h-screen bg-site-bg">
      <PublicHeader />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row gap-10 mb-12">
          <div className="flex-none">
            {coverPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPhoto}
                alt={product.title}
                className="w-full md:w-[480px] aspect-square object-cover rounded-lg border border-site-border"
              />
            ) : (
              <div className="w-full md:w-[480px] aspect-square rounded-lg bg-white border border-site-border" />
            )}
          </div>

          <div className="flex flex-col justify-start pt-2">
            <h1 className="font-display text-4xl font-semibold text-site-text leading-tight mb-3">
              {product.title}
            </h1>
            {(product.part_number || product.vendor) && (
              <p className="text-sm text-site-muted mb-4">
                {product.part_number && (
                  <span className="font-mono">Part #{product.part_number}</span>
                )}
                {product.part_number && product.vendor && ' · '}
                {product.vendor}
              </p>
            )}
            {product.description && (
              <p className="text-base text-site-text leading-relaxed mb-6">{product.description}</p>
            )}

            <div className="rounded-lg border border-site-border bg-white px-6 py-5 inline-flex flex-col gap-1.5">
              {product.condition && (
                <p className="text-sm text-site-muted">
                  {conditionLabel[product.condition as ProductCondition]}
                </p>
              )}
              <p className="text-2xl font-semibold text-site-text">
                {formatPrice(product.price_cents)}
              </p>
              <p className={`text-sm font-medium ${product.qty_for_sale > 0 ? 'text-green-700' : 'text-site-muted'}`}>
                {product.qty_for_sale > 0 ? `${product.qty_for_sale} in stock` : 'Out of stock'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
