// PHASE 1 HONESTY NOTE:
// Until the Phase 2 Stripe webhooks ship, a completed payment does NOT yet
// create an order row, and an expired session does NOT release holds.
// Phase 2 closes both. Do not deploy checkout to real customers between phases.

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const SHIPPING_FLAT_CENTS = parseInt(process.env.SHIPPING_FLAT_CENTS ?? '1500', 10)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Checkout not configured.' }, { status: 500 })
  }

  // 1. Parse and validate body
  let productIds: string[]
  try {
    const body = await request.json() as { productIds?: unknown }
    if (!Array.isArray(body.productIds) || body.productIds.length === 0) {
      return NextResponse.json({ error: 'productIds required' }, { status: 400 })
    }
    productIds = (body.productIds as unknown[]).filter(
      (id): id is string => typeof id === 'string' && UUID_RE.test(id),
    )
    if (productIds.length === 0) {
      return NextResponse.json({ error: 'No valid product IDs' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // 2. Fetch products server-side; reject any that are not visibility=public or lack a price
  const supabase = await createClient()
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, title, slug, price_cents, visibility')
    .in('id', productIds)

  if (fetchError || !products) {
    return NextResponse.json({ error: 'Failed to fetch products.' }, { status: 500 })
  }

  const productMap = new Map(products.map((p) => [p.id, p]))
  const invalid = productIds.filter((id) => {
    const p = productMap.get(id)
    return !p || p.visibility !== 'public' || !p.price_cents
  })
  if (invalid.length > 0) {
    return NextResponse.json({ error: 'One or more products are unavailable.' }, { status: 400 })
  }

  // 3. Claim each part atomically via service-role client (RPCs are service_role only)
  const admin = createAdminClient()
  const claimed: string[] = []
  const soldOutIds: string[] = []

  for (const id of productIds) {
    const { data, error } = await admin.rpc('claim_part', { product_id: id })
    if (error || !data || data.length === 0) {
      soldOutIds.push(id)
    } else {
      claimed.push(id)
    }
  }

  if (soldOutIds.length > 0) {
    for (const id of claimed) {
      await admin.rpc('release_part', { product_id: id })
    }
    return NextResponse.json({ soldOutIds }, { status: 409 })
  }

  // 4. Create Stripe Checkout Session from SERVER prices
  const origin = new URL(request.url).origin
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60

  try {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = productIds.map((id) => {
      const p = productMap.get(id)!
      return {
        price_data: {
          currency: 'usd',
          product_data: { name: p.title },
          unit_amount: p.price_cents,
        },
        quantity: 1,
      }
    })

    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Shipping' },
        unit_amount: SHIPPING_FLAT_CENTS,
      },
      quantity: 1,
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      expires_at: expiresAt,
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ['US', 'CA'] },
      success_url: `${origin}/checkout/success`,
      cancel_url: `${origin}/cart`,
      metadata: { product_ids: productIds.join(',') },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout] Stripe error:', err)
    for (const id of claimed) {
      await admin.rpc('release_part', { product_id: id })
    }
    return NextResponse.json({ error: 'Payment service error.' }, { status: 502 })
  }
}
