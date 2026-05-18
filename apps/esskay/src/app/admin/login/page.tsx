'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Wordmark, Button } from '@amyv/ui'
import { createBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.replace('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-site-bg flex items-center justify-center px-4">
      <div className="bg-white border border-site-border rounded-lg p-8 w-full max-w-sm shadow-sm">
        <div className="flex justify-center mb-6">
          <Wordmark size="lg" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-site-text">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-site-border rounded px-3 py-2 text-sm text-site-text focus:outline-none focus:ring-2 focus:ring-site-accent"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-site-text">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-site-border rounded px-3 py-2 text-sm text-site-text focus:outline-none focus:ring-2 focus:ring-site-accent"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-site-text cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="accent-site-accent-dark"
            />
            Remember me
          </label>

          {error && <p className="text-red-600 text-xs -mt-1">{error}</p>}

          <Button variant="primary" type="submit" disabled={loading} className="w-full justify-center">
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>

          <div className="text-center">
            <Link
              href="/admin/forgot-password"
              className="text-sm text-site-muted hover:text-site-accent-dark transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
