import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminNav } from '@/components/AdminNav'
import { Wordmark } from '@amyv/ui'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-site-bg border-b border-site-border">
        <div className="flex items-center gap-6 px-6 h-14">
          {/* Wordmark */}
          <Wordmark size="sm" className="flex-none" />

          {/* Nav — centered */}
          <div className="flex-1 flex justify-center">
            <AdminNav />
          </div>

          {/* User + sign out */}
          <div className="flex-none flex items-center gap-3">
            <span className="text-site-muted text-xs hidden sm:block truncate max-w-[200px]">
              {user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-site-accent-dark hover:underline whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-8 py-8">{children}</main>
    </div>
  )
}
