import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Table, TableHeader, TableRow, TableCell, EmptyState } from '@amyv/ui'
import { PartsTableBody } from './PartsTableBody'

export default async function PartsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select(
      'id, title, sku, part_number, manufacturer, photo_urls, price_cents, qty_on_hand, qty_for_sale, visibility'
    )
    .order('created_at', { ascending: false })
    .limit(50)

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

      {parts.length === 0 ? (
        <EmptyState
          message={
            <>
              No parts yet. Click <strong>Add Part</strong> to add your first one.
            </>
          }
        />
      ) : (
        <div className="rounded-lg border border-site-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-0">
                <TableCell header>Photo</TableCell>
                <TableCell header>Title</TableCell>
                <TableCell header>SKU</TableCell>
                <TableCell header>Part No.</TableCell>
                <TableCell header>Manufacturer</TableCell>
                <TableCell header>Visibility</TableCell>
                <TableCell header>Qty</TableCell>
                <TableCell header>Price</TableCell>
              </TableRow>
            </TableHeader>
            <PartsTableBody parts={parts} />
          </Table>
        </div>
      )}
    </div>
  )
}
