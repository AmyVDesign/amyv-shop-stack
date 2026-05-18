'use client'

import { useRouter } from 'next/navigation'
import { Badge, TableRow, TableCell } from '@amyv/ui'

type Visibility = 'public' | 'internal' | 'ebay_only'

interface Part {
  id: string
  title: string
  sku: string
  part_number: string | null
  manufacturer: string | null
  photo_urls: string[]
  price_cents: number
  qty_on_hand: number
  qty_for_sale: number
  visibility: Visibility
}

const visibilityBadge: Record<Visibility, { variant: 'green' | 'gray' | 'orange'; label: string }> = {
  public:    { variant: 'green',  label: 'Public'    },
  internal:  { variant: 'gray',   label: 'Internal'  },
  ebay_only: { variant: 'orange', label: 'eBay Only' },
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export function PartsTableBody({ parts }: { parts: Part[] }) {
  const router = useRouter()

  return (
    <tbody>
      {parts.map((part) => {
        const badge = visibilityBadge[part.visibility]
        return (
          <TableRow
            key={part.id}
            onClick={() => router.push(`/admin/products/${part.id}`)}
            className="cursor-pointer hover:bg-site-bg/60 transition-colors"
          >
            {/* Photo */}
            <TableCell className="w-14">
              {part.photo_urls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={part.photo_urls[0]}
                  alt=""
                  width={40}
                  height={40}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-site-border" />
              )}
            </TableCell>

            {/* Title */}
            <TableCell className="max-w-[220px]">
              <span className="line-clamp-2 leading-snug">{part.title}</span>
            </TableCell>

            {/* SKU */}
            <TableCell>
              <span className="font-mono text-xs text-site-muted">{part.sku}</span>
            </TableCell>

            {/* Part Number */}
            <TableCell>
              <span className="text-site-muted">{part.part_number ?? '—'}</span>
            </TableCell>

            {/* Manufacturer */}
            <TableCell>
              <span className="text-site-muted">{part.manufacturer ?? '—'}</span>
            </TableCell>

            {/* Visibility */}
            <TableCell>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </TableCell>

            {/* Qty */}
            <TableCell className="tabular-nums">
              {part.qty_on_hand} / {part.qty_for_sale}
            </TableCell>

            {/* Price */}
            <TableCell className="tabular-nums">
              {formatPrice(part.price_cents)}
            </TableCell>
          </TableRow>
        )
      })}
    </tbody>
  )
}
