import { createClient } from '@/lib/supabase/server'
import type { Database } from '@amyv/supabase/types'
import { TasksClient } from './TasksClient'

type CustomerTask = Database['public']['Tables']['customer_tasks']['Row']

export type TaskWithCustomer = CustomerTask & {
  customers: { first_name: string | null; last_name: string | null; phone: string } | null
}

export default async function TasksPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('customer_tasks')
    .select('*, customers(first_name, last_name, phone)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  const tasks = (data ?? []) as TaskWithCustomer[]

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-site-text mb-6">Tasks</h1>
      <TasksClient tasks={tasks} />
    </div>
  )
}
