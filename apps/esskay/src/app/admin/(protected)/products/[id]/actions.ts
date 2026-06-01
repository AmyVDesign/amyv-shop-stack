'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ProductCondition } from '@/lib/product-labels'

export async function updatePart(
  id: string,
  canonicalId: string,
  formData: FormData,
): Promise<void> {
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

  // Fetch previous link state to detect changes (needed for slug uniqueness)
  const { data: existing } = await supabase
    .from('products')
    .select('linked_listing_id')
    .eq('id', id)
    .single()

  const linkChanged = linkedListingId !== (existing?.linked_listing_id ?? null)
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
    console.error('[updatePart] update failed:', updateError)
    redirect(`/admin/products/${canonicalId}?error=save_failed`)
  }

  revalidatePath(`/admin/products/${canonicalId}`)
  redirect(`/admin/products/${canonicalId}`)
}
