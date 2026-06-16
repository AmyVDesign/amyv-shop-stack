import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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

  return (
    <div className="px-6 py-8 max-w-4xl">
      <h1 className="text-2xl font-display font-semibold text-site-text mb-6">Customers</h1>

      {rows.length === 0 ? (
        <p className="text-sm text-site-muted">No customers yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-site-border">
              <th scope="col" className="text-left pb-3 pr-4 font-medium text-site-muted">
                Name
              </th>
              <th scope="col" className="text-left pb-3 pr-4 font-medium text-site-muted">
                Phone
              </th>
              <th scope="col" className="text-left pb-3 pr-4 font-medium text-site-muted">
                Email
              </th>
              <th scope="col" className="text-right pb-3 font-medium text-site-muted">
                Orders
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.phone}
                className="border-b border-site-border/40 hover:bg-site-accent-navy-light/20 transition-colors"
              >
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/customers/${encodeURIComponent(c.phone)}`}
                    className="font-medium text-site-text hover:text-site-accent-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded"
                  >
                    {displayName(c)}
                  </Link>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-site-muted">{c.phone}</td>
                <td className="py-3 pr-4 text-site-muted">{c.email ?? '--'}</td>
                <td className="py-3 text-right text-site-muted">
                  {orderCountByPhone.get(c.phone) ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
