'use server'

import { createClient } from '@/lib/supabase/server'

export async function findMatchingPart(
  partNumber: string,
  manufacturer: string,
  excludeId?: string,
): Promise<{ id: string; title: string } | null> {
  const supabase = await createClient()

  let q = supabase
    .from('products')
    .select('id, title')
    .eq('part_number', partNumber)
    .eq('manufacturer', manufacturer)
    .order('created_at', { ascending: false })
    .limit(1)

  if (excludeId) q = q.neq('id', excludeId)

  const { data, error } = await q.maybeSingle()

  if (error) {
    console.error('[findMatchingPart] query failed:', error)
    return null
  }

  return data
}
