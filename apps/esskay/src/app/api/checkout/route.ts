import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const SHIPPING_FLAT_CENTS = parseInt(process.env.SHIPPING_FLAT_CENTS ?? '1500', 10)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type CheckoutItem = { productId: string; quantity: number }

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Checkout not configured.' }, { status: 500 })
  }

  // 1. Parse and validate body
  let items: CheckoutItem[]
  try {
    const body = await request.json() as { items?: unknown }
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 20) {
      return NextResponse.json({ error: 'items required (1-20 line items)' }, { status: 400 })
    }
    const parsed = (body.items as unknown[]).map((entry) => {
      if (typeof entry !== 'object' || entry === null) return null
      const { productId, quantity } = entry as Record<string, unknown>
      if (typeof productId !== 'string' || !UUID_RE.test(productId)) return null
      if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return null
      return { productId, quantity } satisfies CheckoutItem
    }).filter((e): e is CheckoutItem => e !== null)
    if (parsed.length === 0) {
      return NextResponse.json({ error: 'No valid items' }, { status: 400 })
    }
    items = parsed
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // 2. Fetch products server-side; reject non-public or priceless products
  const supabase = await createClient()
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, title, price_cents, visibility, qty_for_sale, photo_urls')
    .in('id', items.map((i) => i.productId))

  if (fetchError || !products) {
    return NextResponse.json({ error: 'Failed to fetch products.' }, { status: 500 })
  }

  const productMap = new Map(products.map((p) => [p.id, p]))

  const unavailable = items.filter((item) => {
    const p = productMap.get(item.productId)
    return !p || p.visibility !== 'public' || !p.price_cents
  })
  if (unavailable.length > 0) {
    return NextResponse.json({ error: 'One or more products are unavailable.' }, { status: 400 })
  }

  // Pre-check: reject quantities that already exceed current stock. The
  // claim_parts RPC is still the atomic source of truth; this surfaces the
  // most common case (buyer held stale qty) before touching the database.
  const overstock = items.filter((item) => {
    const p = productMap.get(item.productId)!
    return item.quantity > p.qty_for_sale
  })
  if (overstock.length > 0) {
    return NextResponse.json(
      { failedIds: overstock.map((i) => i.productId) },
      { status: 409 },
    )
  }

  // 3. Claim each product atomically via service-role client (RPCs are service_role only)
  const admin = createAdminClient()
  const claimed: CheckoutItem[] = []
  const failedIds: string[] = []

  for (const item of items) {
    const { data, error } = await admin.rpc('claim_parts', {
      product_id: item.productId,
      qty: item.quantity,
    })
    if (error || data === null || data === 0) {
      failedIds.push(item.productId)
    } else {
      claimed.push(item)
    }
  }

  if (failedIds.length > 0) {
    for (const c of claimed) {
      await admin.rpc('release_parts', { product_id: c.productId, qty: c.quantity })
    }
    return NextResponse.json({ failedIds }, { status: 409 })
  }

  // 4. Create Stripe Checkout Session from SERVER prices
  const origin = new URL(request.url).origin
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60

  try {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => {
      const p = productMap.get(item.productId)!
      const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData = {
        name: p.title,
      }
      if (p.photo_urls[0]) productData.images = [p.photo_urls[0]]
      return {
        price_data: { currency: 'usd', product_data: productData, unit_amount: p.price_cents },
        quantity: item.quantity,
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
      phone_number_collection: { enabled: true },
      success_url: `${origin}/checkout/success`,
      cancel_url: `${origin}/cart`,
      metadata: {
        items: JSON.stringify(items.map((i) => ({ productId: i.productId, quantity: i.quantity }))),
        shipping_cents: String(SHIPPING_FLAT_CENTS),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout] Stripe error:', err)
    for (const c of claimed) {
      await admin.rpc('release_parts', { product_id: c.productId, qty: c.quantity })
    }
    return NextResponse.json({ error: 'Payment service error.' }, { status: 502 })
  }
}
