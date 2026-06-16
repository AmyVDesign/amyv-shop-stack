'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Table, TableHeader, TableRow, TableCell } from '@amyv/ui'

export interface CustomerRow {
  phone: string
  displayName: string
  email: string | null
  city: string | null
  state: string | null
  orderCount: number
}

export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  const router = useRouter()

  return (
    <div className="rounded-xl border border-site-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-0">
            <TableCell header>Name</TableCell>
            <TableCell header>Phone</TableCell>
            <TableCell header>Email</TableCell>
            <TableCell header>Location</TableCell>
            <TableCell header className="text-right">Orders</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {customers.map((c) => {
            const href = `/admin/customers/${encodeURIComponent(c.phone)}`
            return (
              <TableRow
                key={c.phone}
                interactive
                onClick={() => router.push(href)}
              >
                <TableCell>
                  <Link
                    href={href}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-site-text hover:text-site-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded"
                  >
                    {c.displayName}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-site-muted">{c.phone}</span>
                </TableCell>
                <TableCell>
                  <span className="text-site-muted">{c.email ?? '--'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-site-muted">
                    {[c.city, c.state].filter(Boolean).join(', ') || '--'}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums text-site-muted">
                  {c.orderCount}
                </TableCell>
              </TableRow>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}
