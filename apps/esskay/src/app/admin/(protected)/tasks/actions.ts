'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function completeTask(
  taskId: string,
  customer_phone: string,
): Promise<{ error?: string }> {
  if (!UUID_RE.test(taskId)) return { error: 'Invalid task ID.' }
  if (!customer_phone) return { error: 'Invalid customer.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Session expired. Please sign in again.' }

  const { error } = await supabase
    .from('customer_tasks')
    .update({
      status:       'done',
      completed_at: new Date().toISOString(),
      completed_by: user.email,
    })
    .eq('id', taskId)
    .eq('customer_phone', customer_phone)

  if (error) {
    console.error('[tasks/completeTask]', error)
    return { error: 'Failed to complete task.' }
  }

  revalidatePath('/admin/tasks')
  revalidatePath(`/admin/customers/${encodeURIComponent(customer_phone)}`)
  return {}
}
