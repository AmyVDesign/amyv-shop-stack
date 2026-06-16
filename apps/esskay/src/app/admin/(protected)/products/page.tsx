import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PartsClient } from './PartsClient'

export default async function PartsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      'id, title, sku, part_number, vendor, condition, photo_urls, price_cents, qty_on_hand, qty_for_sale, visibility, linked_listing_id, created_at, category_label'
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[products page] query failed:', error)
  }

  const parts = data ?? []

  return (
    <div className="px-6 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-site-text">Parts</h1>
        <Link
          href="/admin/products/new"
          className="rounded font-body font-medium transition-colors text-sm px-4 py-2 bg-site-bg border border-site-accent-dark text-site-accent-dark hover:bg-site-accent-light"
        >
          Add Part
        </Link>
      </div>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load parts. Check server logs.
        </div>
      ) : (
        <PartsClient parts={parts} />
      )}
    </div>
  )
}
