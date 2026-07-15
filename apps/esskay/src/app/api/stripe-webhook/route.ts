// LOCAL TESTING
// 1. stripe listen --forward-to localhost:3001/api/stripe-webhook
// 2. Copy the whsec_... it prints into STRIPE_WEBHOOK_SECRET in .env.local
// 3. Run a test purchase; confirm the order row, order_items rows, stock
//    unchanged (claim already happened at session creation), and the email
//    log line in the terminal.
// 4. stripe trigger checkout.session.expired -- verify release_parts runs
//    and qty_for_sale increments back on the affected product.

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/format'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

type MetadataItem = { productId: string; quantity: number }

function parseMetadataItems(raw: string | null | undefined): MetadataItem[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    const valid = (parsed as unknown[]).every(
      (item): item is MetadataItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).productId === 'string' &&
        typeof (item as Record<string, unknown>).quantity === 'number',
    )
    return valid ? (parsed as MetadataItem[]) : null
  } catch {
    return null
  }
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

export async function POST(request: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe-webhook] Stripe or STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  // Raw body must be read before any other processing; JSON parsing would
  // mutate the stream and break signature verification.
  const rawBody = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing Stripe-Signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed':
      return handleCompleted(event.data.object as Stripe.Checkout.Session)
    case 'checkout.session.expired':
      return handleExpired(event.data.object as Stripe.Checkout.Session)
    default:
      return NextResponse.json({})
  }
}

async function handleCompleted(session: Stripe.Checkout.Session): Promise<Response> {
  const admin = createAdminClient()

  // 1. Idempotency: if an order already exists for this session, stop.
  const { data: existing } = await admin
    .from('orders')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle()
  if (existing) return NextResponse.json({})

  // 2. Parse metadata
  const metaItems = parseMetadataItems(session.metadata?.items)
  if (!metaItems) {
    console.error('[stripe-webhook] Missing or invalid metadata.items for session', session.id)
    return NextResponse.json({ error: 'Invalid session metadata' }, { status: 400 })
  }

  // 3. Fetch products for snapshot and unit prices
  const productIds = metaItems.map((i) => i.productId)
  const { data: products, error: productErr } = await admin
    .from('products')
    .select('id, title, part_number, vendor, condition, photo_urls, price_cents')
    .in('id', productIds)
  if (productErr || !products) {
    console.error('[stripe-webhook] Product fetch failed:', productErr)
    return NextResponse.json({ error: 'Product fetch failed' }, { status: 500 })
  }
  const productMap = new Map(products.map((p) => [p.id, p]))

  // 4. Resolve and upsert customer from session.customer_details
  let normalizedPhone: string | null = null
  const rawPhone = session.customer_details?.phone
  if (rawPhone) {
    normalizedPhone = normalizePhone(rawPhone)
    if (!normalizedPhone) {
      console.warn('[stripe-webhook] Could not normalize phone to E.164:', rawPhone)
    }
  }

  if (normalizedPhone) {
    const fullName = (session.customer_details?.name ?? '').trim()
    const parts = fullName.split(/\s+/)
    const firstName = parts[0] || null
    const lastName = parts.slice(1).join(' ') || null
    const email = session.customer_details?.email || null

    const { data: existingCustomer } = await admin
      .from('customers')
      .select('first_name, last_name, email')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (!existingCustomer) {
      const { error: custErr } = await admin.from('customers').insert({
        phone: normalizedPhone,
        first_name: firstName,
        last_name: lastName,
        email,
      })
      // '23505' = unique_violation: concurrent insert won the race, customer
      // exists -- phone is still valid for the order link.
      if (custErr && custErr.code !== '23505') {
        console.error('[stripe-webhook] Customer insert failed:', custErr)
        normalizedPhone = null
      }
    } else {
      // Only fill fields that are currently empty on the existing record.
      const updates: { first_name?: string; last_name?: string; email?: string } = {}
      if (!existingCustomer.first_name && firstName) updates.first_name = firstName
      if (!existingCustomer.last_name && lastName) updates.last_name = lastName
      if (!existingCustomer.email && email) updates.email = email
      if (Object.keys(updates).length > 0) {
        await admin.from('customers').update(updates).eq('phone', normalizedPhone)
      }
    }
  }

  // 5. Insert order
  const shippingCents = parseInt(session.metadata?.shipping_cents ?? '0', 10)
  const totalCents = session.amount_total ?? 0
  const subtotalCents = totalCents - shippingCents
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null

  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      tax_cents: 0,
      total_cents: totalCents,
      customer_phone: normalizedPhone,
    })
    .select('id')
    .single()

  if (orderErr) {
    // '23505' = unique_violation: a concurrent webhook delivery created the
    // order first. The race lost cleanly; idempotency is preserved.
    if (orderErr.code === '23505') return NextResponse.json({})
    console.error('[stripe-webhook] Order insert failed:', orderErr)
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
  }

  // 6. Insert order_items
  const orderItems = metaItems.map((item) => {
    const product = productMap.get(item.productId)
    const snapshot = product
      ? {
          title: product.title,
          part_number: product.part_number ?? null,
          vendor: product.vendor ?? null,
          condition: product.condition ?? null,
          photo_url: product.photo_urls[0] ?? null,
        }
      : { title: '(product deleted)', part_number: null, vendor: null, condition: null, photo_url: null }
    return {
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price_cents: product?.price_cents ?? 0,
      product_snapshot: snapshot,
    }
  })

  const { error: itemsErr } = await admin.from('order_items').insert(orderItems)
  if (itemsErr) {
    console.error('[stripe-webhook] order_items insert failed for order', order.id, ':', itemsErr)
    // Do not return 500: the order row exists and Stripe would re-deliver,
    // causing a duplicate-order attempt blocked by idempotency. Log for
    // manual repair instead.
  }

  // 7. Confirmation email (non-fatal: log and continue on any failure)
  try {
    const toEmail = session.customer_details?.email
    if (!resend) {
      console.log('[stripe-webhook] RESEND_API_KEY not set; skipping email for order', order.id)
    } else if (!toEmail) {
      console.log('[stripe-webhook] No customer email; skipping confirmation for order', order.id)
    } else {
      await sendConfirmationEmail({
        orderId: order.id,
        toEmail,
        metaItems,
        productMap,
        shippingCents,
        totalCents,
      })
    }
  } catch (err) {
    console.error('[stripe-webhook] Confirmation email failed for order', order.id, ':', err)
  }

  return NextResponse.json({})
}

async function handleExpired(session: Stripe.Checkout.Session): Promise<Response> {
  const metaItems = parseMetadataItems(session.metadata?.items)
  if (!metaItems) {
    console.error('[stripe-webhook] Expired session missing parseable metadata.items:', session.id)
    // Return 200 -- we cannot release holds we cannot identify. The stock will
    // need a manual correction for this session. Stripe will not retry on 200.
    return NextResponse.json({})
  }

  const admin = createAdminClient()
  for (const item of metaItems) {
    const { error } = await admin.rpc('release_parts', {
      product_id: item.productId,
      qty: item.quantity,
    })
    if (error) {
      console.error('[stripe-webhook] release_parts failed for expired session', session.id, item, error)
      // Continue releasing remaining holds even if one fails.
    }
  }

  return NextResponse.json({})
}

type SendEmailArgs = {
  orderId: string
  toEmail: string
  metaItems: MetadataItem[]
  productMap: Map<string, { title: string; price_cents: number }>
  shippingCents: number
  totalCents: number
}

async function sendConfirmationEmail({
  orderId,
  toEmail,
  metaItems,
  productMap,
  shippingCents,
  totalCents,
}: SendEmailArgs) {
  const shortId = orderId.slice(0, 8).toUpperCase()

  const itemRows = metaItems
    .map((item) => {
      const product = productMap.get(item.productId)
      const title = product?.title ?? '(item)'
      const lineTotal = (product?.price_cents ?? 0) * item.quantity
      const qtyLabel = item.quantity > 1 ? ` x${item.quantity}` : ''
      return `
        <tr>
          <td style="padding:6px 0;color:#111">${title}${qtyLabel}</td>
          <td style="padding:6px 0;text-align:right;color:#111;white-space:nowrap">${formatCurrency(lineTotal)}</td>
        </tr>`
    })
    .join('')

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h2 style="margin:0 0 4px">Ess-Kay Yards</h2>
      <p style="margin:0 0 16px;color:#444">Thanks for your order. We will be in touch to confirm shipment details.</p>
      <p style="margin:0 0 16px">Order <strong>#${shortId}</strong></p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 12px">
      <table style="width:100%;border-collapse:collapse">
        <tbody>${itemRows}</tbody>
      </table>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:4px 0;color:#444">Shipping</td>
          <td style="padding:4px 0;text-align:right;color:#444">${formatCurrency(shippingCents)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0"><strong>Total</strong></td>
          <td style="padding:4px 0;text-align:right"><strong>${formatCurrency(totalCents)}</strong></td>
        </tr>
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#6b7280">
        Questions? Reply to this email or call us at the marina.
      </p>
    </div>`

  await resend!.emails.send({
    // TODO: replace with orders@esskay.com (or similar) once the domain is
    // verified in Resend at launch.
    from: 'Ess-Kay Yards <onboarding@resend.dev>',
    to: toEmail,
    subject: `Order confirmed -- Ess-Kay Yards (#${shortId})`,
    html,
  })
}
