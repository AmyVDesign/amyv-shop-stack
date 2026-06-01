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
  manufacturer: string,
  excludeId?: string,
): Promise<MatchedPart | null> {
  const supabase = await createClient()

  let q = supabase
    .from('products')
    .select('id, title, photo_urls, condition, price_cents, qty_for_sale, qty_on_hand, visibility')
    .ilike('part_number', partNumber.trim())
    .ilike('manufacturer', manufacturer.trim())
    .order('created_at', { ascending: false })
    .limit(1)

  if (excludeId) q = q.neq('id', excludeId)

  const { data, error } = await q.maybeSingle()

  if (error) {
    console.error('[findMatchingPart] query failed:', error)
    return null
  }

  return data as MatchedPart | null
}
