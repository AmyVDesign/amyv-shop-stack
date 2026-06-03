import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ProductCondition } from '@/lib/product-labels'
import { ProductForm } from '../ProductForm'

export default async function NewPartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  async function createPart(formData: FormData) {
    'use server'
    const supabase = await createClient()

    const title = String(formData.get('title') ?? '').trim()
    const sku = String(formData.get('sku') ?? '').trim()
    const partNumber = String(formData.get('part_number') ?? '').trim() || null
    const vendor = String(formData.get('vendor') ?? '').trim() || null
    const conditionVal = (String(formData.get('condition') ?? '').trim() || null) as ProductCondition | null
    const priceStr = String(formData.get('price') ?? '0')
    const priceCents = Math.round(parseFloat(priceStr) * 100)
    const qtyOnHand = Math.max(0, parseInt(String(formData.get('qty_on_hand') ?? '0'), 10) || 0)
    const qtyForSale = Math.max(0, parseInt(String(formData.get('qty_for_sale') ?? '0'), 10) || 0)
    const visibility = String(formData.get('visibility') ?? 'internal') as 'public' | 'internal' | 'ebay_only'
    const description = String(formData.get('description') ?? '').trim() || null
    const conditionNotes = conditionVal === 'new'
      ? null
      : String(formData.get('condition_notes') ?? '').trim() || null
    const photoUrls = formData.getAll('photo_urls').filter(Boolean) as string[]
    const linkedListingIdRaw = String(formData.get('linked_listing_id') ?? '').trim()
    const linkedListingId = linkedListingIdRaw || null
    const standaloneListing = visibility === 'public' && formData.get('standalone_listing') === 'true'

    const baseSlug = `${title}-${sku}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    // Linked parts share the parent's public URL — the slug is never shown but must be unique
    const slug = linkedListingId
      ? `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`
      : baseSlug

    const { error: insertError } = await supabase.from('products').insert({
      title,
      sku,
      slug,
      part_number: partNumber,
      vendor,
      condition: conditionVal,
      price_cents: priceCents,
      qty_on_hand: qtyOnHand,
      qty_for_sale: qtyForSale,
      visibility,
      description,
      condition_notes: conditionNotes,
      photo_urls: photoUrls,
      linked_listing_id: linkedListingId,
      standalone_listing: standaloneListing,
      source: 'manual',
    })

    if (insertError) {
      console.error('[new part] insert failed:', insertError)
      redirect('/admin/products/new?error=save_failed')
    }

    redirect('/admin/products')
  }

  return (
    <div className="px-6 py-8 max-w-2xl">
      <Link
        href="/admin/products"
        className="text-sm text-site-accent-dark hover:underline mb-6 inline-block"
      >
        ← Parts
      </Link>

      <h1 className="text-2xl font-display font-semibold text-site-text mb-6">Add Part</h1>

      <ProductForm
        mode="create"
        action={createPart}
        submitLabel="Save Part"
        cancelHref="/admin/products"
        errorMessage={error === 'save_failed' ? 'Failed to save part. Check server logs.' : undefined}
      />
    </div>
  )
}
