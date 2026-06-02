'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { PhotoUploader } from './PhotoUploader'
import { findMatchingPart } from './actions'
import type { MatchedPart } from './actions'
import { conditionLabel, productConditionOptions } from '@/lib/product-labels'
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
  linked_listing_id: string | null
  standalone_listing: boolean
}

interface ProductFormProps {
  mode: 'create' | 'edit'
  initialValues?: ProductFormValues
  action: (formData: FormData) => Promise<void>
  submitLabel: string
  cancelHref: string
  errorMessage?: string
  excludeId?: string
  onCancel?: () => void
}

const inputClass =
  'w-full rounded border border-site-border bg-white px-3 py-1.5 text-sm text-site-text focus:outline-none focus:ring-1 focus:ring-site-accent'
const selectClass =
  'w-full rounded border border-site-border bg-white px-3 py-1.5 text-sm text-site-text focus:outline-none focus:ring-1 focus:ring-site-accent'

export function ProductForm({
  mode,
  initialValues,
  action,
  submitLabel,
  cancelHref,
  errorMessage,
  excludeId,
  onCancel,
}: ProductFormProps) {
  // Gating fields — controlled so we can derive gatingComplete and trigger match checks
  const [partNumber, setPartNumber] = useState(initialValues?.part_number ?? '')
  const [manufacturer, setManufacturer] = useState(initialValues?.manufacturer ?? '')
  const [visibility, setVisibility] = useState<'public' | 'internal' | 'ebay_only'>(
    initialValues?.visibility ?? 'internal'
  )

  // Storefront display choice — only relevant when visibility=public and a match is found
  const [storefrontChoice, setStorefrontChoice] = useState<'unchosen' | 'variant' | 'standalone'>(
    initialValues?.standalone_listing
      ? 'standalone'
      : initialValues?.linked_listing_id
        ? 'variant'
        : 'unchosen'
  )

  // Match detection
  const [matchResult, setMatchResult] = useState<MatchedPart | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestQueryId = useRef(0)

  // Link decision: auto-set from match detection, no user choice required
  const [linkedListingId, setLinkedListingId] = useState<string | null>(
    initialValues?.linked_listing_id ?? null
  )

  // In create mode, downstream fields gate on part number + manufacturer being filled.
  // Visibility always has a value so it never blocks gating.
  const gatingComplete = mode === 'edit' || (partNumber.trim() !== '' && manufacturer.trim() !== '')

  // On mount in edit mode: run the match check if part_number + manufacturer are set,
  // and auto-link if a match is found.
  useEffect(() => {
    if (!initialValues?.part_number || !initialValues.manufacturer) return
    const qId = ++latestQueryId.current
    findMatchingPart(
      initialValues.part_number.trim(),
      initialValues.manufacturer.trim(),
      excludeId
    ).then((match) => {
      if (qId === latestQueryId.current && match) {
        setMatchResult(match)
        setLinkedListingId(match.id)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Linking is independent of visibility — fire the check whenever pn + mfr are both filled.
  // Auto-links to the matched part; clears the link when no match.
  function scheduleCheck(pn: string, mfr: string) {
    setMatchResult(null)
    setLinkedListingId(null)
    setStorefrontChoice('unchosen')

    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Bump ID before any early return so stale callbacks don't overwrite cleared state
    const qId = ++latestQueryId.current

    const trimPn = pn.trim()
    const trimMfr = mfr.trim()
    if (!trimPn || !trimMfr) return

    // Edit mode: skip if values haven't changed from initial (avoids redundant check on first render)
    if (
      excludeId &&
      trimPn === (initialValues?.part_number?.trim() ?? '') &&
      trimMfr === (initialValues?.manufacturer?.trim() ?? '')
    ) {
      return
    }

    debounceRef.current = setTimeout(async () => {
      const match = await findMatchingPart(trimPn, trimMfr, excludeId)
      if (qId === latestQueryId.current) {
        setMatchResult(match)
        setLinkedListingId(match?.id ?? null)
      }
    }, 400)
  }

  const showStorefrontModal =
    visibility === 'public' && matchResult !== null && storefrontChoice === 'unchosen'

  return (
    <>
      {showStorefrontModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center py-8 px-4">
            <div className="fixed inset-0 bg-black/50" />
            <div className="relative w-full max-w-lg bg-white rounded-lg border border-site-border shadow-xl overflow-hidden">
              <div className="px-6 pt-6 pb-5 border-b border-site-border">
                <h2 className="text-lg font-display font-semibold text-site-text">
                  This part already exists in the storefront
                </h2>
              </div>
              <div className="px-6 py-5">
                {/* Match card */}
                <div className="flex gap-4 mb-5 p-4 rounded border border-site-border bg-[#f8f5f0]">
                  {matchResult.photo_urls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={matchResult.photo_urls[0]}
                      alt={matchResult.title}
                      width={96}
                      height={96}
                      className="flex-none w-24 h-24 object-cover rounded border border-site-border"
                    />
                  ) : (
                    <div className="flex-none w-24 h-24 rounded border border-site-border bg-white" />
                  )}
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-site-text leading-snug mb-1">
                      {matchResult.title}
                    </p>
                    <p className="text-sm text-site-muted">
                      {matchResult.condition ? conditionLabel[matchResult.condition] : 'No condition'}
                    </p>
                    <p className="text-sm text-site-muted">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                        matchResult.price_cents / 100
                      )}
                    </p>
                    <p className="text-sm text-site-muted">
                      {matchResult.qty_for_sale} for sale / {matchResult.qty_on_hand} on hand
                    </p>
                  </div>
                </div>

                <p className="text-sm font-medium text-site-text mb-3">
                  How should this new listing appear on the public storefront?
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setStorefrontChoice('variant')}
                    className="w-full rounded px-4 py-2.5 text-sm font-medium text-left bg-site-accent-dark text-white hover:bg-site-accent transition-colors"
                  >
                    Show as a variant on the existing product page
                  </button>
                  <button
                    type="button"
                    onClick={() => setStorefrontChoice('standalone')}
                    className="w-full rounded px-4 py-2.5 text-sm font-medium text-left border border-site-accent-dark text-site-accent-dark hover:bg-site-accent-light transition-colors"
                  >
                    Give it its own storefront page
                  </button>
                </div>

                <p className="text-xs text-site-muted mt-4">
                  Either way, this listing is still grouped with the existing part in your admin records.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          {errorMessage}
        </div>
      )}

      <form action={action}>
        {/* Always-submitted hidden fields */}
        <input type="hidden" name="linked_listing_id" value={linkedListingId ?? ''} />
        <input type="hidden" name="standalone_listing" value={storefrontChoice === 'standalone' ? 'true' : 'false'} />

        <div className="rounded-lg border border-site-border overflow-hidden bg-white divide-y divide-site-border mb-6">

          {/* ── Gating fields ─────────────────────────────────────────── */}

          {/* Photos */}
          <div className="grid grid-cols-3 px-4 py-3 items-start gap-4">
            <span className="text-sm text-site-muted font-medium pt-1.5">Photos</span>
            <div className="col-span-2">
              <PhotoUploader initialPhotoUrls={initialValues?.photo_urls ?? []} />
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

          {/* Visibility */}
          <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
            <label htmlFor="visibility" className="text-sm text-site-muted font-medium">
              Visibility
            </label>
            <div className="col-span-2">
              <select
                id="visibility"
                name="visibility"
                value={visibility}
                onChange={(e) => {
                  setVisibility(e.target.value as 'public' | 'internal' | 'ebay_only')
                  setStorefrontChoice('unchosen')
                }}
                className={selectClass}
              >
                <option value="internal">Internal</option>
                <option value="public">Public</option>
                <option value="ebay_only">eBay Only</option>
              </select>
            </div>
          </div>

          {/* Storefront choice confirmation pill */}
          {visibility === 'public' && matchResult && storefrontChoice !== 'unchosen' && (
            <div className="px-4 py-3 bg-[#e8f0f8] border-t border-site-border">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-site-accent-dark font-semibold">✓</span>
                <div className="flex-1 text-site-text">
                  {storefrontChoice === 'variant' ? (
                    <>
                      Will appear on the storefront as a variant of{' '}
                      <a
                        href={`/admin/products/${matchResult.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-display font-semibold text-site-accent-dark hover:underline"
                      >
                        {matchResult.title}
                      </a>
                    </>
                  ) : (
                    <>Will have its own storefront page</>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setStorefrontChoice('unchosen')}
                  className="text-xs text-site-accent hover:underline"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* ── Helper text + downstream fields ──────────────────────── */}

          {/* Prompt — only in create mode while gating is incomplete */}
          {!gatingComplete && mode === 'create' && (
            <div className="px-4 py-2 bg-[#f8f5f0]">
              <p className="text-xs text-site-muted">
                Fill in part number and manufacturer above to continue.
              </p>
            </div>
          )}

          {/* Downstream fields — pointer-events off + faded until gating complete */}
          <div
            className={
              !gatingComplete && mode === 'create'
                ? 'divide-y divide-site-border pointer-events-none opacity-50'
                : 'divide-y divide-site-border'
            }
          >
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
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={mode === 'create' && !gatingComplete}
            className={[
              'rounded font-body font-medium transition-colors text-sm px-4 py-2',
              mode === 'create' && !gatingComplete
                ? 'bg-site-border text-site-muted cursor-not-allowed'
                : 'bg-site-accent-dark text-white hover:bg-site-accent',
            ].join(' ')}
          >
            {submitLabel}
          </button>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-site-muted hover:text-site-text transition-colors"
            >
              Cancel
            </button>
          ) : (
            <Link
              href={cancelHref}
              className="text-sm text-site-muted hover:text-site-text transition-colors"
            >
              Cancel
            </Link>
          )}
        </div>
      </form>
    </>
  )
}
