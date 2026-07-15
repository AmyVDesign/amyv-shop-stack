export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { conditionLabel } from '@/lib/product-labels'
import type { ProductCondition } from '@/lib/product-labels'
import { PublicHeader } from '@/components/PublicHeader'
import { ProductsClient } from './ProductsClient'
import type { ListingCard } from './ProductsClient'

export const metadata: Metadata = {
  title: 'Marine Parts | Ess-Kay Yards',
  description:
    'Browse marine parts in stock at Ess-Kay Yards, Brewerton NY -- new, NOS, and used parts for outboards, sterndrives, and more.',
}

const SELECT =
  'id, title, slug, part_number, condition, price_cents, qty_for_sale, photo_urls, linked_listing_id, standalone_listing, created_at'

type Product = {
  id: string
  title: string
  slug: string
  part_number: string | null
  condition: string | null
  price_cents: number
  qty_for_sale: number
  photo_urls: string[]
  linked_listing_id: string | null
  standalone_listing: boolean
  created_at: string
}

const CONDITION_ORDER = ['new', 'nos', 'used_good', 'used_fair', 'needs_rebuild', 'parts_only']

function buildCard(canonical: Product, children: Product[]): ListingCard {
  const all = [canonical, ...children]

  const combinedQty = all.reduce((sum, p) => sum + p.qty_for_sale, 0)

  const prices = all.map((p) => p.price_cents)
  const minPriceCents = Math.min(...prices)
  const maxPriceCents = Math.max(...prices)

  const photoUrl =
    canonical.photo_urls[0] ??
    children.find((c) => c.photo_urls[0])?.photo_urls[0] ??
    null

  const uniqueConditions = [
    ...new Set(all.map((p) => p.condition).filter((c): c is string => c !== null)),
  ]
  uniqueConditions.sort((a, b) => {
    const ai = CONDITION_ORDER.indexOf(a)
    const bi = CONDITION_ORDER.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
  const conditionSummary = uniqueConditions
    .map((c) => conditionLabel[c as ProductCondition] ?? c)
    .join(', ')

  return {
    slug: canonical.slug,
    title: canonical.title,
    part_number: canonical.part_number,
    photoUrl,
    conditionSummary,
    minPriceCents,
    maxPriceCents,
    combinedQty,
  }
}

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select(SELECT)
    .eq('visibility', 'public')

  const all = (products ?? []) as Product[]

  const canonicals = all.filter((p) => !p.linked_listing_id)
  const standalones = all.filter((p) => p.linked_listing_id && p.standalone_listing)
  const nonStandaloneChildren = all.filter((p) => p.linked_listing_id && !p.standalone_listing)

  // Index children by canonical id for O(n) grouping
  const childrenByParent = new Map<string, Product[]>()
  for (const child of nonStandaloneChildren) {
    const existing = childrenByParent.get(child.linked_listing_id!)
    if (existing) {
      existing.push(child)
    } else {
      childrenByParent.set(child.linked_listing_id!, [child])
    }
  }

  // Build slug → created_at for sorting before stripping the field from cards
  const createdAtBySlug = new Map(all.map((p) => [p.slug, p.created_at]))

  const cards: ListingCard[] = [
    ...canonicals.map((p) => buildCard(p, childrenByParent.get(p.id) ?? [])),
    ...standalones.map((p) => buildCard(p, [])),
  ].sort((a, b) => {
    const aInStock = a.combinedQty > 0
    const bInStock = b.combinedQty > 0
    if (aInStock !== bInStock) return aInStock ? -1 : 1
    // Within same stock group: newest first
    return (createdAtBySlug.get(b.slug) ?? '').localeCompare(createdAtBySlug.get(a.slug) ?? '')
  })

  return (
    <div className="min-h-screen bg-site-bg">
      <PublicHeader />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl font-semibold text-site-text mb-8">
          Marine parts
        </h1>

        <ProductsClient cards={cards} />
      </main>
    </div>
  )
}
