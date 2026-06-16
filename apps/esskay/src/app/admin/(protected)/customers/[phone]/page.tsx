import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@amyv/supabase/types'
import { OrderCard } from './OrderCard'
import type { OrderWithItems } from './OrderCard'
import { TasksSection } from './TasksSection'
import { HistoryAccordion } from './HistoryAccordion'
import { BoatNote } from './BoatNote'

type CustomerTask = Database['public']['Tables']['customer_tasks']['Row']

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function formatPhone(phone: string): string {
  const us = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/)
  if (us) return `(${us[1]}) ${us[2]}-${us[3]}`
  return phone
}

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ phone: string }>
}) {
  const { phone: rawPhone } = await params
  const phone = decodeURIComponent(rawPhone)

  const supabase = await createClient()

  const [customerResult, ordersResult, tasksResult] = await Promise.all([
    supabase.from('customers').select('*').eq('phone', phone).single(),
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false }),
    supabase
      .from('customer_tasks')
      .select('*')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false }),
  ])

  if (!customerResult.data) notFound()

  const c = customerResult.data
  const orders = (ordersResult.data ?? []) as OrderWithItems[]
  const allTasks = (tasksResult.data ?? []) as CustomerTask[]

  const openTasks = allTasks.filter((t) => t.status === 'open')
  const doneTasks = allTasks.filter((t) => t.status === 'done')
  const totalSpentCents = orders.reduce((sum, o) => sum + o.total_cents, 0)

  const displayName =
    [c.first_name, c.last_name].filter(Boolean).join(' ') || formatPhone(c.phone)
  const location = [c.city, c.state].filter(Boolean).join(', ')

  return (
    <div>
      <Link
        href="/admin/customers"
        className="text-sm text-site-muted hover:text-site-text mb-6 inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded"
      >
        <span aria-hidden="true">{'← '}</span>Customers
      </Link>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-display font-semibold text-site-text tracking-[0.04em]">
          {displayName}
        </h1>
        {location && <p className="text-site-muted mt-1">{location}</p>}
      </div>

      {/* Contact section */}
      <section aria-labelledby="contact-heading" className="mb-6">
        <h2
          id="contact-heading"
          className="text-lg font-display font-semibold text-site-text mb-3"
        >
          Contact
        </h2>
        <div className="border border-site-border rounded-xl p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {(c.first_name || c.last_name) && (
              <div>
                <dt className="text-site-muted">Name</dt>
                <dd className="text-site-text font-medium mt-0.5">{displayName}</dd>
              </div>
            )}
            <div>
              <dt className="text-site-muted">Phone</dt>
              <dd className="text-site-text font-mono mt-0.5">{formatPhone(c.phone)}</dd>
            </div>
            {c.email && (
              <div>
                <dt className="text-site-muted">Email</dt>
                <dd className="text-site-text mt-0.5">{c.email}</dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-site-muted">Boat</dt>
              <dd className="mt-1">
                <BoatNote phone={phone} initialNote={c.boat_note} />
              </dd>
            </div>

            {c.address_line_1 && (
              <div className="sm:col-span-2">
                <dt className="text-site-muted">Address</dt>
                <dd className="text-site-text mt-0.5">
                  {c.address_line_1}
                  {c.address_line_2 && (
                    <>
                      <br />
                      {c.address_line_2}
                    </>
                  )}
                  {(c.city || c.state || c.postal_code) && (
                    <>
                      <br />
                      {[c.city, c.state, c.postal_code].filter(Boolean).join(', ')}
                    </>
                  )}
                  {c.country && c.country !== 'US' && (
                    <>
                      <br />
                      {c.country}
                    </>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-site-border rounded-xl p-4">
          <p className="text-xs text-site-muted uppercase tracking-widest mb-1">Orders</p>
          <p className="text-2xl font-semibold text-site-text">{orders.length}</p>
        </div>
        <div className="border border-site-border rounded-xl p-4">
          <p className="text-xs text-site-muted uppercase tracking-widest mb-1">Total spent</p>
          <p className="text-2xl font-semibold text-site-text">{formatCents(totalSpentCents)}</p>
        </div>
        <div className="border border-site-border rounded-xl p-4">
          <p className="text-xs text-site-muted uppercase tracking-widest mb-1">Open tasks</p>
          <p className="text-2xl font-semibold text-site-text">{openTasks.length}</p>
        </div>
      </div>

      {/* Orders */}
      <section aria-labelledby="orders-heading" className="mb-8">
        <h2
          id="orders-heading"
          className="text-lg font-display font-semibold text-site-text mb-3"
        >
          Orders
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-site-muted">No orders on record.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

      {/* Tasks (client component -- form + open task list) */}
      <div className="mb-8">
        <TasksSection phone={phone} openTasks={openTasks} />
      </div>

      {/* History accordion -- collapsed by default */}
      {doneTasks.length > 0 && (
        <div className="mb-8">
          <HistoryAccordion tasks={doneTasks} />
        </div>
      )}

      {/* Stays placeholder */}
      <section aria-labelledby="stays-heading" className="mb-8">
        <h2
          id="stays-heading"
          className="text-lg font-display font-semibold text-site-text mb-2"
        >
          Stays
        </h2>
        <p className="text-sm text-site-muted">Coming later.</p>
      </section>
    </div>
  )
}
