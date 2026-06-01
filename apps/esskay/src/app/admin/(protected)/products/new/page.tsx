import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { productConditionOptions } from '@/lib/product-labels'
import type { ProductCondition } from '@/lib/product-labels'
import { PhotoUploader } from './PhotoUploader'

export default async function NewPartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  async function createPart(formData: FormData) {
    'use server'
    const supabase = await createClient()

    const title = String(formData.get('title') ?? '').trim()
    const sku = String(formData.get('sku') ?? '').trim()
    const partNumber = String(formData.get('part_number') ?? '').trim() || null
    const manufacturer = String(formData.get('manufacturer') ?? '').trim() || null
    const conditionVal = (String(formData.get('condition') ?? '').trim() || null) as ProductCondition | null
    const priceStr = String(formData.get('price') ?? '0')
    const priceCents = Math.round(parseFloat(priceStr) * 100)
    const qtyOnHand = Math.max(0, parseInt(String(formData.get('qty_on_hand') ?? '0'), 10) || 0)
    const qtyForSale = Math.max(0, parseInt(String(formData.get('qty_for_sale') ?? '0'), 10) || 0)
    const visibility = String(formData.get('visibility') ?? 'internal') as 'public' | 'internal' | 'ebay_only'
    const description = String(formData.get('description') ?? '').trim() || null
    const photoUrls = formData.getAll('photo_urls').filter(Boolean) as string[]

    const slug = `${title}-${sku}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const { error: insertError } = await supabase.from('products').insert({
      title,
      sku,
      slug,
      part_number: partNumber,
      manufacturer,
      condition: conditionVal,
      price_cents: priceCents,
      qty_on_hand: qtyOnHand,
      qty_for_sale: qtyForSale,
      visibility,
      description,
      photo_urls: photoUrls,
      source: 'manual',
    })

    if (insertError) {
      console.error('[new part] insert failed:', insertError)
      redirect('/admin/products/new?error=save_failed')
    }

    redirect('/admin/products')
  }

  const inputClass =
    'w-full rounded border border-site-border bg-white px-3 py-1.5 text-sm text-site-text focus:outline-none focus:ring-1 focus:ring-site-accent'
  const selectClass =
    'w-full rounded border border-site-border bg-white px-3 py-1.5 text-sm text-site-text focus:outline-none focus:ring-1 focus:ring-site-accent'

  return (
    <div className="px-6 py-8 max-w-2xl">
      <Link
        href="/admin/products"
        className="text-sm text-site-accent-dark hover:underline mb-6 inline-block"
      >
        ← Parts
      </Link>

      <h1 className="text-2xl font-display font-semibold text-site-text mb-6">Add Part</h1>

      {error === 'save_failed' && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          Failed to save part. Check server logs.
        </div>
      )}

      <form action={createPart}>
        <div className="rounded-lg border border-site-border overflow-hidden bg-white divide-y divide-site-border mb-6">
          {/* Photos */}
          <div className="grid grid-cols-3 px-4 py-3 items-start gap-4">
            <span className="text-sm text-site-muted font-medium pt-1.5">Photos</span>
            <div className="col-span-2">
              <PhotoUploader />
            </div>
          </div>

          {/* Title */}
          <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
            <label htmlFor="title" className="text-sm text-site-muted font-medium">
              Title <span className="text-red-500">*</span>
            </label>
            <div className="col-span-2">
              <input
                id="title"
                name="title"
                type="text"
                required
                className={inputClass}
                placeholder="e.g. Mercruiser water pump impeller"
              />
            </div>
          </div>

          {/* SKU */}
          <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
            <label htmlFor="sku" className="text-sm text-site-muted font-medium">
              SKU <span className="text-red-500">*</span>
            </label>
            <div className="col-span-2">
              <input
                id="sku"
                name="sku"
                type="text"
                required
                className={inputClass}
                placeholder="e.g. ESK-1042"
              />
            </div>
          </div>

          {/* Part Number */}
          <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
            <label htmlFor="part_number" className="text-sm text-site-muted font-medium">
              Part Number
            </label>
            <div className="col-span-2">
              <input
                id="part_number"
                name="part_number"
                type="text"
                className={inputClass}
                placeholder="OEM or aftermarket part number"
              />
            </div>
          </div>

          {/* Manufacturer */}
          <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
            <label htmlFor="manufacturer" className="text-sm text-site-muted font-medium">
              Manufacturer
            </label>
            <div className="col-span-2">
              <input
                id="manufacturer"
                name="manufacturer"
                type="text"
                className={inputClass}
                placeholder="e.g. Mercruiser"
              />
            </div>
          </div>

          {/* Condition */}
          <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
            <label htmlFor="condition" className="text-sm text-site-muted font-medium">
              Condition
            </label>
            <div className="col-span-2">
              <select id="condition" name="condition" className={selectClass}>
                <option value="">— Select condition (optional) —</option>
                {productConditionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
            <label htmlFor="price" className="text-sm text-site-muted font-medium">
              Price (USD) <span className="text-red-500">*</span>
            </label>
            <div className="col-span-2">
              <input
                id="price"
                name="price"
                type="number"
                required
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Qty On Hand */}
          <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
            <label htmlFor="qty_on_hand" className="text-sm text-site-muted font-medium">
              Qty On Hand
            </label>
            <div className="col-span-2">
              <input
                id="qty_on_hand"
                name="qty_on_hand"
                type="number"
                min="0"
                step="1"
                defaultValue="0"
                className={inputClass}
              />
            </div>
          </div>

          {/* Qty For Sale */}
          <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
            <label htmlFor="qty_for_sale" className="text-sm text-site-muted font-medium">
              Qty For Sale
            </label>
            <div className="col-span-2">
              <input
                id="qty_for_sale"
                name="qty_for_sale"
                type="number"
                min="0"
                step="1"
                defaultValue="0"
                className={inputClass}
              />
              <p className="text-xs text-site-muted mt-1">Must be ≤ qty on hand</p>
            </div>
          </div>

          {/* Visibility */}
          <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
            <label htmlFor="visibility" className="text-sm text-site-muted font-medium">
              Visibility
            </label>
            <div className="col-span-2">
              <select id="visibility" name="visibility" defaultValue="internal" className={selectClass}>
                <option value="internal">Internal</option>
                <option value="public">Public</option>
                <option value="ebay_only">eBay Only</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-3 px-4 py-3 items-start gap-4">
            <label htmlFor="description" className="text-sm text-site-muted font-medium pt-1.5">
              Notes
            </label>
            <div className="col-span-2">
              <textarea
                id="description"
                name="description"
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Additional notes about this part (optional)"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded font-body font-medium transition-colors text-sm px-4 py-2 bg-site-accent-dark text-white hover:bg-site-accent"
          >
            Save Part
          </button>
          <Link
            href="/admin/products"
            className="text-sm text-site-muted hover:text-site-text transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
