import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@amyv/ui'
import { CustomersTable } from './CustomersTable'
import type { CustomerRow } from './CustomersTable'

function displayName(c: { first_name: string | null; last_name: string | null; phone: string }): string {
  const name = [c.first_name, c.last_name].filter(Boolean).join(' ')
  return name || c.phone
}

export default async function CustomersPage() {
  const supabase = await createClient()

  const [{ data: customers }, { data: orderRows }] = await Promise.all([
    supabase
      .from('customers')
      .select('phone, first_name, last_name, email, city, state')
      .order('created_at', { ascending: false }),
    supabase.from('orders').select('customer_phone'),
  ])

  const rows = customers ?? []

  const orderCountByPhone = new Map<string, number>()
  for (const order of orderRows ?? []) {
    if (!order.customer_phone) continue
    orderCountByPhone.set(
      order.customer_phone,
      (orderCountByPhone.get(order.customer_phone) ?? 0) + 1,
    )
  }

  const tableRows: CustomerRow[] = rows.map((c) => ({
    phone: c.phone,
    displayName: displayName(c),
    email: c.email,
    city: c.city ?? null,
    state: c.state ?? null,
    orderCount: orderCountByPhone.get(c.phone) ?? 0,
  }))

  return (
    <div className="px-6 py-8 max-w-4xl">
      <h1 className="text-2xl font-display font-semibold text-site-text mb-6">Customers</h1>

      {tableRows.length === 0 ? (
        <EmptyState message="No customers yet." />
      ) : (
        <CustomersTable customers={tableRows} />
      )}
    </div>
  )
}
