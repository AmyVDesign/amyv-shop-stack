'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@amyv/supabase/types'

type TaskType = Database['public']['Enums']['task_type']

export async function createTask(
  customer_phone: string,
  type: TaskType,
  body: string,
): Promise<{ error?: string }> {
  const trimmed = body.trim()
  if (!trimmed) return { error: 'Notes are required.' }
  if (trimmed.length > 500) return { error: 'Notes must be 500 characters or fewer.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('customer_tasks').insert({
    customer_phone,
    type,
    body: trimmed,
    created_by: user?.email ?? null,
  })

  if (error) {
    console.error('[createTask]', error)
    return { error: 'Failed to create task.' }
  }

  revalidatePath(`/admin/customers/${encodeURIComponent(customer_phone)}`)
  return {}
}

export async function completeTask(taskId: string, customer_phone: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('customer_tasks')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('id', taskId)

  if (error) {
    console.error('[completeTask]', error)
  }

  revalidatePath(`/admin/customers/${encodeURIComponent(customer_phone)}`)
}
