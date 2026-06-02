import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Wordmark } from '@amyv/ui'
import { conditionLabel } from '@/lib/product-labels'
import type { ProductCondition } from '@/lib/product-labels'

const SELECT =
  'id, title, slug, part_number, manufacturer, condition, price_cents, qty_for_sale, description, photo_urls, linked_listing_id, standalone_listing, visibility'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('title, description').eq('slug', slug).maybeSingle()
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

  // Canonical or standalone: determine variants to display
  let displayVariants: typeof product[] = [product]

  if (!product.linked_listing_id) {
    // Canonical — fetch public non-standalone children
    const { data: children } = await supabase
      .from('products')
      .select(SELECT)
      .eq('linked_listing_id', product.id)
      .eq('visibility', 'public')
      .eq('standalone_listing', false)
      .order('created_at', { ascending: true })

    displayVariants = [product, ...(children ?? [])]
  }

  const coverPhoto = product.photo_urls[0] ?? null

  return (
    <div className="min-h-screen bg-site-bg">
      {/* Public header */}
      <header className="border-b border-site-border bg-site-bg">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Wordmark size="sm" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="flex flex-col md:flex-row gap-10 mb-12">
          {/* Cover photo */}
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

          {/* Product info */}
          <div className="flex flex-col justify-start pt-2">
            <h1 className="font-display text-4xl font-semibold text-site-text leading-tight mb-3">
              {product.title}
            </h1>
            {product.part_number && (
              <p className="font-mono text-sm text-site-muted mb-1">{product.part_number}</p>
            )}
            {product.manufacturer && (
              <p className="text-sm text-site-muted mb-4">{product.manufacturer}</p>
            )}
            {product.description && (
              <p className="text-sm text-site-text leading-relaxed">{product.description}</p>
            )}
          </div>
        </div>

        {/* Variants section */}
        {displayVariants.length === 1 ? (
          // Single listing — show details inline
          <div className="rounded-lg border border-site-border bg-white p-6 inline-flex flex-col gap-2">
            <p className="text-2xl font-semibold text-site-text">
              {formatPrice(displayVariants[0].price_cents)}
            </p>
            {displayVariants[0].condition && (
              <p className="text-sm text-site-muted">
                {conditionLabel[displayVariants[0].condition as ProductCondition]}
              </p>
            )}
            <p className={`text-sm font-medium ${displayVariants[0].qty_for_sale > 0 ? 'text-green-700' : 'text-site-muted'}`}>
              {displayVariants[0].qty_for_sale > 0 ? 'In stock' : 'Out of stock'}
            </p>
          </div>
        ) : (
          // Multiple variants — card grid
          <section>
            <h2 className="font-display text-xl font-semibold text-site-text mb-4">Available</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayVariants.map((v) => (
                <div
                  key={v.id}
                  className="rounded-lg border border-site-border bg-white overflow-hidden flex flex-col"
                >
                  {v.photo_urls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.photo_urls[0]}
                      alt={v.title}
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-site-bg" />
                  )}
                  <div className="p-3 flex flex-col gap-1">
                    <p className="text-sm font-semibold text-site-text leading-snug">{v.title}</p>
                    {v.condition && (
                      <p className="text-xs text-site-muted">
                        {conditionLabel[v.condition as ProductCondition]}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-site-text mt-0.5">
                      {formatPrice(v.price_cents)}
                    </p>
                    <p className={`text-xs font-medium ${v.qty_for_sale > 0 ? 'text-green-700' : 'text-site-muted'}`}>
                      {v.qty_for_sale > 0 ? 'In stock' : 'Out of stock'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
