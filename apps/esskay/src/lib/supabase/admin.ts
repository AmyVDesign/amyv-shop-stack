import 'server-only'
import { createServiceClient } from '@amyv/supabase/client'

// Bypasses RLS via the service role key. Must only be imported from server
// code; the 'server-only' guard above makes any client-side import a build error.
export function createAdminClient() {
  return createServiceClient()
}
