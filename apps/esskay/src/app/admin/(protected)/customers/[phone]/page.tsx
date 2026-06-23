import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@amyv/supabase/types'
import { OrderCard } from './OrderCard'
import type { OrderWithItems } from './OrderCard'
import { TasksSection } from './TasksSection'
import { HistoryAccordion } from './HistoryAccordion'
import { ContactCard } from './ContactCard'

type CustomerTask   = Database['public']['Tables']['customer_tasks']['Row']
type CustomerChange = Database['public']['Tables']['customer_changes']['Row']

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

  const [customerResult, ordersResult, tasksResult, changesResult] = await Promise.all([
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
    supabase
      .from('customer_changes')
      .select('*')
      .eq('customer_phone', phone)
      .order('changed_at', { ascending: false }),
  ])

  if (!customerResult.data) notFound()

  const c = customerResult.data
  const orders = (ordersResult.data ?? []) as OrderWithItems[]
  const allTasks = (tasksResult.data ?? []) as CustomerTask[]
  const changes = (changesResult.data ?? []) as CustomerChange[]

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

      {/* Contact card -- single Edit button, logs changes to customer_changes */}
      <ContactCard phone={phone} customer={c} />

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-site-border rounded-xl p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-site-muted mb-1">Orders</p>
          <p className="text-2xl font-normal text-site-text">{orders.length}</p>
        </div>
        <div className="border border-site-border rounded-xl p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-site-muted mb-1">Total spent</p>
          <p className="text-2xl font-normal text-site-text">{formatCents(totalSpentCents)}</p>
        </div>
        <div className="border border-site-border rounded-xl p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-site-muted mb-1">Open tasks</p>
          <p className="text-2xl font-normal text-site-text">{openTasks.length}</p>
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

      {/* History -- task history + contact change log */}
      <div className="mb-8">
        <HistoryAccordion tasks={doneTasks} changes={changes} />
      </div>

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
