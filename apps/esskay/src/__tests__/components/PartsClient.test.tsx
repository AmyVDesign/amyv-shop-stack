// Contrast is verified in the Playwright e2e layer, not here,
// because jsdom does not compute CSS custom property styles.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import type { Part } from '@/app/admin/(protected)/products/PartsTableBody'

// next/navigation must be mocked because PartsTableBody calls useRouter
vi.mock('next/navigation', () => ({
  useRouter:   () => ({ push: vi.fn() }),
  usePathname: () => '/admin/products',
}))

// Lazy import after mock is registered
const { PartsClient } = await import('@/app/admin/(protected)/products/PartsClient')

const SAMPLE_PARTS: Part[] = [
  {
    id: 'part-1',
    title: 'Carburetor',
    sku: 'ESK-001',
    part_number: '147-0831',
    vendor: 'Onan',
    condition: 'new',
    photo_urls: [],
    price_cents: 28500,
    qty_on_hand: 1,
    qty_for_sale: 1,
    visibility: 'public',
    linked_listing_id: null,
    created_at: '2024-01-01T00:00:00Z',
    category_label: 'Marine Engine Parts',
  },
  {
    id: 'part-2',
    title: 'Voltage Regulator',
    sku: 'ESK-002',
    part_number: '167-1185',
    vendor: 'Onan',
    condition: 'used_good',
    photo_urls: [],
    price_cents: 9500,
    qty_on_hand: 2,
    qty_for_sale: 2,
    visibility: 'public',
    linked_listing_id: null,
    created_at: '2024-01-02T00:00:00Z',
    category_label: null,
  },
]

describe('PartsClient control bar accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('has no axe violations with sample parts', async () => {
    const { container } = render(<PartsClient parts={SAMPLE_PARTS} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations with an empty parts list', async () => {
    const { container } = render(<PartsClient parts={[]} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
