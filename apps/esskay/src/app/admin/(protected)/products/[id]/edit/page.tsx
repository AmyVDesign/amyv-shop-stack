import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ProductCondition } from '@/lib/product-labels'
import { ProductForm } from '../../ProductForm'
import type { ProductFormValues } from '../../ProductForm'

export default async function EditPartPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams])
  const supabase = await createClient()

  const { data: part, error: partError } = await supabase
    .from('products')
    .select(
      'id, title, sku, part_number, manufacturer, photo_urls, price_cents, qty_on_hand, qty_for_sale, visibility, condition, description, linked_listing_id'
    )
    .eq('id', id)
    .single()

  if (partError || !part) {
    console.error('[edit part] query failed:', partError)
    notFound()
  }

  async function updatePart(formData: FormData) {
    'use server'
    const supabase = await createClient()

    const title = String(formData.get('title') ?? '').trim()
    const sku = String(formData.get('sku') ?? '').trim()
    const partNumber = String(formData.get('part_number') ?? '').trim() || null
    const manufacturer = String(formData.get('manufacturer') ?? '').trim() || null
    const conditionVal = (String(formData.get('condition') ?? '').trim() || null) as ProductCondition | null
    const priceStr = String(formData.get('price') ?? '0')
    const priceCents = Math.round(parseFloat(priceStr) * 100)
    const qtyOnHand = Math.max(0, parseInt(String(formData.get('qty_on_hand') ?? '0'), 10) || 0)
    const qtyForSale = Math.max(0, parseInt(String(formData.get('qty_for_sale') ?? '0'), 10) || 0)
    const visibility = String(formData.get('visibility') ?? 'internal') as 'public' | 'internal' | 'ebay_only'
    const description = String(formData.get('description') ?? '').trim() || null
    const photoUrls = formData.getAll('photo_urls').filter(Boolean) as string[]
    const linkedListingIdRaw = String(formData.get('linked_listing_id') ?? '').trim()
    const linkedListingId = visibility === 'public' && linkedListingIdRaw ? linkedListingIdRaw : null

    // Regenerate slug when the part gains a new link (slug is never shown for linked parts
    // but must satisfy the unique constraint; use a suffix to avoid colliding with the parent)
    const linkChanged = linkedListingId !== part!.linked_listing_id
    const slugField =
      linkedListingId && linkChanged
        ? {
            slug: `${`${title}-${sku}`
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')}-${Math.random().toString(36).slice(2, 8)}`,
          }
        : {}

    const { error: updateError } = await supabase
      .from('products')
      .update({
        ...slugField,
        title,
        sku,
        part_number: partNumber,
        manufacturer,
        condition: conditionVal,
        price_cents: priceCents,
        qty_on_hand: qtyOnHand,
        qty_for_sale: qtyForSale,
        visibility,
        description,
        photo_urls: photoUrls,
        linked_listing_id: linkedListingId,
      })
      .eq('id', id)

    if (updateError) {
      console.error('[edit part] update failed:', updateError)
      redirect(`/admin/products/${id}/edit?error=save_failed`)
    }

    redirect(`/admin/products/${id}`)
  }

  const initialValues: ProductFormValues = {
    title: part.title,
    sku: part.sku,
    part_number: part.part_number,
    manufacturer: part.manufacturer,
    condition: part.condition as ProductCondition | null,
    price_cents: part.price_cents,
    qty_on_hand: part.qty_on_hand,
    qty_for_sale: part.qty_for_sale,
    visibility: part.visibility as 'public' | 'internal' | 'ebay_only',
    description: part.description,
    photo_urls: part.photo_urls,
    linked_listing_id: part.linked_listing_id,
  }

  return (
    <div className="px-6 py-8 max-w-2xl">
      <Link
        href={`/admin/products/${id}`}
        className="text-sm text-site-accent-dark hover:underline mb-6 inline-block"
      >
        ← Part
      </Link>

      <h1 className="text-2xl font-display font-semibold text-site-text mb-6">Edit Part</h1>

      <ProductForm
        mode="edit"
        initialValues={initialValues}
        action={updatePart}
        submitLabel="Save Changes"
        cancelHref={`/admin/products/${id}`}
        errorMessage={error === 'save_failed' ? 'Failed to save changes. Check server logs.' : undefined}
        excludeId={id}
      />
    </div>
  )
}
