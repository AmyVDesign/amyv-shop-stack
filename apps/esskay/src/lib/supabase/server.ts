import { cookies } from 'next/headers'
import { createServerClient } from '@amyv/supabase/client'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient({
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cookieStore.set(name, value, options as any)
        )
      } catch {
        // Server Components cannot set cookies during render; proxy handles this
      }
    },
  })
}
