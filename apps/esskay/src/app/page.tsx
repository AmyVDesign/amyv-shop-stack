import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'

export default function Home() {
  return (
    <div className="min-h-screen bg-site-bg flex flex-col">
      <PublicHeader />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-24 flex flex-col items-start justify-center">
        <p className="text-site-muted mb-8">
          Marine parts, including the ones nobody else has.
        </p>
        <Link
          href="/products"
          className="text-sm font-medium text-site-accent-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded"
        >
          Browse parts
        </Link>
      </main>
    </div>
  )
}
