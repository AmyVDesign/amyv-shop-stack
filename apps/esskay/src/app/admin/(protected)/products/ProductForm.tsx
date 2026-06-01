'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { PhotoUploader } from './PhotoUploader'
import { findMatchingPart } from './actions'
import { productConditionOptions } from '@/lib/product-labels'
import type { ProductCondition } from '@/lib/product-labels'

export interface ProductFormValues {
  title: string
  sku: string
  part_number: string | null
  manufacturer: string | null
  condition: ProductCondition | null
  price_cents: number
  qty_on_hand: number
  qty_for_sale: number
  visibility: 'public' | 'internal' | 'ebay_only'
  description: string | null
  photo_urls: string[]
}

interface ProductFormProps {
  mode: 'create' | 'edit'
  initialValues?: ProductFormValues
  action: (formData: FormData) => Promise<void>
  submitLabel: string
  cancelHref: string
  errorMessage?: string
  excludeId?: string
}

const inputClass =
  'w-full rounded border border-site-border bg-white px-3 py-1.5 text-sm text-site-text focus:outline-none focus:ring-1 focus:ring-site-accent'
const selectClass =
  'w-full rounded border border-site-border bg-white px-3 py-1.5 text-sm text-site-text focus:outline-none focus:ring-1 focus:ring-site-accent'

export function ProductForm({
  initialValues,
  action,
  submitLabel,
  cancelHref,
  errorMessage,
  excludeId,
}: ProductFormProps) {
  // Controlled state for the two fields used in match detection
  const [partNumber, setPartNumber] = useState(initialValues?.part_number ?? '')
  const [manufacturer, setManufacturer] = useState(initialValues?.manufacturer ?? '')
  const [matchResult, setMatchResult] = useState<{ id: string; title: string } | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tracks the latest scheduled query so stale results are ignored
  const latestQueryId = useRef(0)

  function scheduleCheck(pn: string, mfr: string) {
    setMatchResult(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Bump before early returns so any in-flight query with the old ID is invalidated
    const qId = ++latestQueryId.current

    const trimPn = pn.trim()
    const trimMfr = mfr.trim()

    if (!trimPn || !trimMfr) return

    // In edit mode skip if unchanged from initial values — no point querying for self
    if (
      excludeId &&
      trimPn === (initialValues?.part_number?.trim() ?? '') &&
      trimMfr === (initialValues?.manufacturer?.trim() ?? '')
    ) return

    debounceRef.current = setTimeout(async () => {
      const match = await findMatchingPart(trimPn, trimMfr, excludeId)
      if (qId === latestQueryId.current) {
        setMatchResult(match)
      }
    }, 400)
  }

  return (
    <>
      {errorMessage && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          {errorMessage}
        </div>
      )}

      <form action={action}>
        <div className="rounded-lg border border-site-border overflow-hidden bg-white divide-y divide-site-border mb-6">
          {/* Photos */}
          <div className="grid grid-cols-3 px-4 py-3 items-start gap-4">
            <span className="text-sm text-site-muted font-medium pt-1.5">Photos</span>
            <div className="col-span-2">
              <PhotoUploader initialPhotoUrls={initialValues?.photo_urls ?? []} />
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
                defaultValue={initialValues?.title ?? ''}
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
                defaultValue={initialValues?.sku ?? ''}
                className={inputClass}
                placeholder="e.g. ESK-1042"
              />
            </div>
          </div>

          {/* Part Number — controlled for match detection */}
          <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
            <label htmlFor="part_number" className="text-sm text-site-muted font-medium">
              Part Number
            </label>
            <div className="col-span-2">
              <input
                id="part_number"
                name="part_number"
                type="text"
                value={partNumber}
                onChange={(e) => {
                  setPartNumber(e.target.value)
                  scheduleCheck(e.target.value, manufacturer)
                }}
                className={inputClass}
                placeholder="OEM or aftermarket part number"
              />
            </div>
          </div>

          {/* Manufacturer — controlled for match detection */}
          <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
            <label htmlFor="manufacturer" className="text-sm text-site-muted font-medium">
              Manufacturer
            </label>
            <div className="col-span-2">
              <input
                id="manufacturer"
                name="manufacturer"
                type="text"
                value={manufacturer}
                onChange={(e) => {
                  setManufacturer(e.target.value)
                  scheduleCheck(partNumber, e.target.value)
                }}
                className={inputClass}
                placeholder="e.g. Mercruiser"
              />
            </div>
          </div>

          {/* Match detection banner */}
          {matchResult && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-[#e8f0f8] text-sm">
              <span className="text-site-accent flex-none select-none" aria-hidden="true">
                ℹ
              </span>
              <span className="text-site-accent-dark flex-1 min-w-0 truncate">
                Possible match:{' '}
                <span className="font-medium">{matchResult.title}</span>
              </span>
              <a
                href={`/admin/products/${matchResult.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-none text-site-accent-dark hover:underline font-medium whitespace-nowrap"
              >
                View it →
              </a>
            </div>
          )}

          {/* Condition */}
          <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
            <label htmlFor="condition" className="text-sm text-site-muted font-medium">
              Condition
            </label>
            <div className="col-span-2">
              <select
                id="condition"
                name="condition"
                defaultValue={initialValues?.condition ?? ''}
                className={selectClass}
              >
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
                defaultValue={
                  initialValues ? (initialValues.price_cents / 100).toFixed(2) : ''
                }
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
                defaultValue={initialValues?.qty_on_hand ?? 0}
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
                defaultValue={initialValues?.qty_for_sale ?? 0}
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
              <select
                id="visibility"
                name="visibility"
                defaultValue={initialValues?.visibility ?? 'internal'}
                className={selectClass}
              >
                <option value="internal">Internal</option>
                <option value="public">Public</option>
                <option value="ebay_only">eBay Only</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-3 px-4 py-3 items-start gap-4">
            <label htmlFor="description" className="text-sm text-site-muted font-medium pt-1.5">
              Notes
            </label>
            <div className="col-span-2">
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={initialValues?.description ?? ''}
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
            {submitLabel}
          </button>
          <Link
            href={cancelHref}
            className="text-sm text-site-muted hover:text-site-text transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}
