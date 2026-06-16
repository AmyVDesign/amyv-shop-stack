'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Home', href: '/admin', exact: true },
  { label: 'Parts', href: '/admin/products' },
  { label: 'Customers', href: '/admin/customers' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Design System', href: '/admin/design-system' },
]

export function AdminNav() {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav aria-label="Admin" className="flex items-center gap-1">
      {NAV_ITEMS.map(({ label, href, exact }) => {
        const active = isActive(href, exact)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={[
              'px-3 py-1.5 rounded text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy',
              active
                ? 'bg-site-accent-dark text-site-bg'
                : 'text-site-text hover:text-site-accent-dark hover:bg-site-accent-dark/8',
            ].join(' ')}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
