import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

async function getCounts(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [partsResult, ordersResult, watchResult] = await Promise.all([
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .gt('qty_on_hand', 0),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('qb_status', 'pending_mom_review'),
    supabase
      .from('parts_watch_list')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open'),
  ])

  return {
    partsInStock: partsResult.count ?? 0,
    ordersPending: ordersResult.count ?? 0,
    watchListOpen: watchResult.count ?? 0,
  }
}

interface StatCardProps {
  count: number
  label: string
  href: string
}

function StatCard({ count, label, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="block bg-white border border-[#0F3A57]/10 rounded-lg p-6 hover:border-[#0F3A57]/30 transition-colors"
    >
      <p className="text-4xl font-bold text-site-accent-dark">{count}</p>
      <p className="text-sm text-site-muted mt-1">{label}</p>
    </Link>
  )
}

export default async function AdminHomePage() {
  const supabase = await createClient()
  const { partsInStock, ordersPending, watchListOpen } = await getCounts(supabase)

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-semibold text-site-text mb-6">Welcome back</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
        <StatCard
          count={partsInStock}
          label="Parts in stock"
          href="/admin/products"
        />
        <StatCard
          count={ordersPending}
          label="Orders pending review"
          href="/admin/orders"
        />
        <StatCard
          count={watchListOpen}
          label="Watch list items"
          href="/admin/watch-list"
        />
      </div>
    </div>
  )
}
