'use client'

import { useRouter } from 'next/navigation'
import { Badge, TableRow, TableCell } from '@amyv/ui'

type Visibility = 'public' | 'internal' | 'ebay_only'
type Source = 'manual' | 'shopify_import' | 'sheets_import'

export interface RelatedListing {
  id: string
  title: string
  sku: string
  visibility: Visibility
  price_cents: number
  qty_on_hand: number
  qty_for_sale: number
  source: Source
}

const visibilityBadge: Record<Visibility, { variant: 'green' | 'gray' | 'orange'; label: string }> = {
  public:    { variant: 'green',  label: 'Public'    },
  internal:  { variant: 'gray',   label: 'Internal'  },
  ebay_only: { variant: 'orange', label: 'eBay Only' },
}

const sourceLabel: Record<Source, string> = {
  manual:         'Manual',
  shopify_import: 'Shopify import',
  sheets_import:  'Sheets import',
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export function RelatedListingsTableBody({ listings }: { listings: RelatedListing[] }) {
  const router = useRouter()

  return (
    <tbody>
      {listings.map((listing) => {
        const badge = visibilityBadge[listing.visibility]
        return (
          <TableRow
            key={listing.id}
            onClick={() => router.push(`/admin/products/${listing.id}`)}
            className="cursor-pointer hover:bg-site-bg/60 transition-colors"
          >
            <TableCell>
              <span className="font-mono text-xs text-site-muted">{listing.sku}</span>
            </TableCell>
            <TableCell className="max-w-[200px]">
              <span className="line-clamp-2 leading-snug">{listing.title}</span>
            </TableCell>
            <TableCell>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </TableCell>
            <TableCell className="tabular-nums text-right">{listing.qty_for_sale}</TableCell>
            <TableCell className="tabular-nums text-right">{listing.qty_on_hand}</TableCell>
            <TableCell className="tabular-nums">{formatPrice(listing.price_cents)}</TableCell>
            <TableCell>
              <span className="text-site-muted text-xs">{sourceLabel[listing.source] ?? listing.source}</span>
            </TableCell>
          </TableRow>
        )
      })}
    </tbody>
  )
}
