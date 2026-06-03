'use server'

import { createClient } from '@/lib/supabase/server'
import type { ProductCondition } from '@/lib/product-labels'

export interface MatchedPart {
  id: string
  title: string
  photo_urls: string[]
  condition: ProductCondition | null
  price_cents: number
  qty_for_sale: number
  qty_on_hand: number
  visibility: 'public' | 'internal' | 'ebay_only'
}

export async function findMatchingPart(
  partNumber: string,
  vendor: string,
  excludeId?: string,
): Promise<MatchedPart | null> {
  const supabase = await createClient()

  let q = supabase
    .from('products')
    .select('id, title, photo_urls, condition, price_cents, qty_for_sale, qty_on_hand, visibility, linked_listing_id')
    .ilike('part_number', partNumber.trim())
    .ilike('vendor', vendor.trim())
    .order('linked_listing_id', { nullsFirst: true }) // prefer canonical (linked_listing_id IS NULL)
    .order('created_at', { ascending: true })         // then oldest first
    .limit(1)

  if (excludeId) q = q.neq('id', excludeId)

  const { data, error } = await q.maybeSingle()

  if (error) {
    console.error('[findMatchingPart] query failed:', error)
    return null
  }

  // Direct match equals the excluded row — no match
  if (data && excludeId && data.id === excludeId) return null

  // Safety: if we somehow got a child row, follow its link to the canonical
  if (data && data.linked_listing_id) {
    const { data: root } = await supabase
      .from('products')
      .select('id, title, photo_urls, condition, price_cents, qty_for_sale, qty_on_hand, visibility')
      .eq('id', data.linked_listing_id)
      .maybeSingle()

    // If the resolved canonical IS the row being edited, there's no external match
    if (root && excludeId && root.id === excludeId) return null

    return root as MatchedPart | null
  }

  return data as MatchedPart | null
}
