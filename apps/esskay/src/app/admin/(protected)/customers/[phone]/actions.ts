'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@amyv/supabase/types'

type TaskType = Database['public']['Enums']['task_type']

// ── Contact update ────────────────────────────────────────────────────────────

interface ContactFields {
  first_name: string
  last_name: string
  email: string
  boat_note: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  postal_code: string
  country: string
}

function buildAddress(
  line1: string | null,
  line2: string | null,
  city: string | null,
  state: string | null,
  postal_code: string | null,
  country: string | null,
): string | null {
  const parts = [
    line1,
    line2,
    [city, state, postal_code].filter(Boolean).join(', ') || null,
    country && country !== 'US' ? country : null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join('\n') : null
}

export async function updateContact(
  customer_phone: string,
  fields: ContactFields,
): Promise<{ error?: string }> {
  const t = {
    first_name:    fields.first_name.trim().slice(0, 100),
    last_name:     fields.last_name.trim().slice(0, 100),
    email:         fields.email.trim().slice(0, 255),
    boat_note:     fields.boat_note.trim().slice(0, 1000),
    address_line_1: fields.address_line_1.trim().slice(0, 200),
    address_line_2: fields.address_line_2.trim().slice(0, 200),
    city:          fields.city.trim().slice(0, 100),
    state:         fields.state.trim().slice(0, 100),
    postal_code:   fields.postal_code.trim().slice(0, 20),
    country:       fields.country.trim().slice(0, 100),
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: current, error: fetchError } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', customer_phone)
    .single()

  if (fetchError || !current) return { error: 'Customer not found.' }

  const { error: updateError } = await supabase
    .from('customers')
    .update({
      first_name:    t.first_name    || null,
      last_name:     t.last_name     || null,
      email:         t.email         || null,
      boat_note:     t.boat_note     || null,
      address_line_1: t.address_line_1 || null,
      address_line_2: t.address_line_2 || null,
      city:          t.city          || null,
      state:         t.state         || null,
      postal_code:   t.postal_code   || null,
      country:       t.country       || null,
    })
    .eq('phone', customer_phone)

  if (updateError) {
    console.error('[updateContact]', updateError)
    return { error: 'Failed to save contact.' }
  }

  // Build diffs for logical fields
  const nameOld = [current.first_name, current.last_name].filter(Boolean).join(' ') || null
  const nameNew = [t.first_name, t.last_name].filter(Boolean).join(' ') || null

  const addrOld = buildAddress(current.address_line_1, current.address_line_2, current.city, current.state, current.postal_code, current.country)
  const addrNew = buildAddress(t.address_line_1 || null, t.address_line_2 || null, t.city || null, t.state || null, t.postal_code || null, t.country || null)

  const diffs: { field: string; old_value: string | null; new_value: string | null }[] = []
  if (nameOld !== nameNew)                      diffs.push({ field: 'Name',    old_value: nameOld,           new_value: nameNew })
  if ((current.email ?? null) !== (t.email || null)) diffs.push({ field: 'Email',   old_value: current.email,     new_value: t.email || null })
  if ((current.boat_note ?? null) !== (t.boat_note || null)) diffs.push({ field: 'Boat',    old_value: current.boat_note, new_value: t.boat_note || null })
  if (addrOld !== addrNew)                      diffs.push({ field: 'Address', old_value: addrOld,           new_value: addrNew })

  if (diffs.length > 0) {
    await supabase.from('customer_changes').insert(
      diffs.map((d) => ({
        customer_phone,
        field:      d.field,
        old_value:  d.old_value,
        new_value:  d.new_value,
        changed_by: user?.email ?? null,
      }))
    )
  }

  revalidatePath(`/admin/customers/${encodeURIComponent(customer_phone)}`)
  return {}
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function createTask(
  customer_phone: string,
  type: TaskType,
  body: string,
): Promise<{ error?: string }> {
  const trimmed = body.trim()
  if (!trimmed) return { error: 'Notes are required.' }
  if (trimmed.length > 500) return { error: 'Notes must be 500 characters or fewer.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function completeTask(taskId: string, customer_phone: string): Promise<{ error?: string }> {
  if (!UUID_RE.test(taskId)) return { error: 'Invalid task ID.' }
  if (!customer_phone) return { error: 'Invalid customer.' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('customer_tasks')
    .update({
      status:       'done',
      completed_at: new Date().toISOString(),
      completed_by: user?.email ?? null,
    })
    .eq('id', taskId)
    .eq('customer_phone', customer_phone)

  if (error) {
    console.error('[completeTask]', error)
    return { error: 'Failed to complete task.' }
  }

  revalidatePath(`/admin/customers/${encodeURIComponent(customer_phone)}`)
  return {}
}
