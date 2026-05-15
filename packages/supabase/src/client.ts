import {
  createBrowserClient as _createBrowserClient,
  createServerClient as _createServerClient,
} from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export function createBrowserClient() {
  return _createBrowserClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']!,
  )
}

type ServerClientCookies = Parameters<typeof _createServerClient>[2]['cookies']

export function createServerClient(cookies: ServerClientCookies) {
  return _createServerClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']!,
    { cookies },
  )
}

/**
 * WARNING: Must never be imported into client code.
 * For server-side scripts, route handlers, or background workers only.
 * Bypasses RLS using the service role key.
 */
export function createServiceClient() {
  return createClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SECRET_KEY']!,
  )
}
