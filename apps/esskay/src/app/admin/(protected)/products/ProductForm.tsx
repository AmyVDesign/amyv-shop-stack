'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { PhotoUploader } from './PhotoUploader'
import { findMatchingPart } from './actions'
import type { MatchedPart } from './actions'
import { productConditionOptions, conditionLabel } from '@/lib/product-labels'
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

  // Title: controlled so the modal can auto-fill it; disabled when linked
  const [titleValue, setTitleValue] = useState(initialValues?.title ?? '')
  const [titleDisabled, setTitleDisabled] = useState(
    mode === 'edit' && !!initialValues?.linked_listing_id
  )

  // Match detection
  const [matchResult, setMatchResult] = useState<MatchedPart | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestQueryId = useRef(0)

  // Link decision: null = standalone, string = linked to that id
  const [linkedListingId, setLinkedListingId] = useState<string | null>(
    initialValues?.linked_listing_id ?? null
  )
  // hasChosen: true once the user picks an option in the modal (or on first load in edit mode)
  const [hasChosen, setHasChosen] = useState(mode === 'edit')

  // In create mode, downstream fields are locked until part_number + manufacturer are filled.
  // Visibility always has a value (defaults to 'internal'), so only two fields gate.
  const gatingComplete = mode === 'edit' || (partNumber.trim() !== '' && manufacturer.trim() !== '')

  // Modal shows when a match is found and the user hasn't answered yet
  const showModal = matchResult !== null && !hasChosen

  // On mount in edit mode: if the part is linked, run the match check once
  // (hasChosen starts true so this never opens the modal — it just populates matchResult)
  useEffect(() => {
    if (!initialValues?.linked_listing_id || !initialValues.part_number || !initialValues.manufacturer) return
    const qId = ++latestQueryId.current
    findMatchingPart(
      initialValues.part_number.trim(),
      initialValues.manufacturer.trim(),
      excludeId
    ).then((match) => {
      if (qId === latestQueryId.current && match) setMatchResult(match)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function scheduleCheck(pn: string, mfr: string, vis: 'public' | 'internal' | 'ebay_only') {
    // Reset all decision state on any gating field change
    setMatchResult(null)
    setHasChosen(false)
    setLinkedListingId(null)
    setTitleDisabled(false)
    setTitleValue(mode === 'create' ? '' : (initialValues?.title ?? ''))

    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Bump ID before any early return so stale callbacks don't overwrite cleared state
    const qId = ++latestQueryId.current

    const trimPn = pn.trim()
    const trimMfr = mfr.trim()
    // Only check when public + both identifier fields are filled
    if (!trimPn || !trimMfr || vis !== 'public') return

    // Edit mode: skip if values haven't changed from initial (avoids check on first render)
    if (
      excludeId &&
      trimPn === (initialValues?.part_number?.trim() ?? '') &&
      trimMfr === (initialValues?.manufacturer?.trim() ?? '')
    ) {
      return
    }

    debounceRef.current = setTimeout(async () => {
      const match = await findMatchingPart(trimPn, trimMfr, excludeId)
      if (qId === latestQueryId.current) setMatchResult(match)
    }, 400)
  }

  return (
    <>
      {errorMessage && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          {errorMessage}
        </div>
      )}

      {/* Match decision modal — appears when a public match is found and user hasn't chosen */}
      {showModal && matchResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-lg border border-site-border shadow-xl overflow-hidden">
            <div className="p-6 space-y-4">
              <p className="text-sm font-semibold text-site-accent-dark">
                We found an existing public listing for this part
              </p>

              {/* Matched part details */}
              <div className="flex gap-4 items-start">
                {matchResult.photo_urls.length > 0 ? (
                  <img
                    src={matchResult.photo_urls[0]}
                    alt={matchResult.title}
                    className="w-24 h-24 rounded object-cover flex-shrink-0 border border-site-border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded flex-shrink-0 bg-[#f8f5f0] border border-site-border" />
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <a
                    href={`/admin/products/${matchResult.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-display font-bold text-site-text leading-tight hover:text-site-accent-dark transition-colors"
                  >
                    {matchResult.title}
                  </a>
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
                    <span className="text-site-muted">Condition</span>
                    <span className="text-site-text">
                      {matchResult.condition ? conditionLabel[matchResult.condition] : '—'}
                    </span>
                    <span className="text-site-muted">Price</span>
                    <span className="text-site-text">
                      ${(matchResult.price_cents / 100).toFixed(2)}
                    </span>
                    <span className="text-site-muted">For sale</span>
                    <span className="text-site-text">
                      {matchResult.qty_for_sale} / {matchResult.qty_on_hand}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-site-text font-medium">
                How should this new listing appear publicly?
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLinkedListingId(matchResult.id)
                    setTitleValue(matchResult.title)
                    setTitleDisabled(true)
                    setHasChosen(true)
                  }}
                  className="px-3 py-1.5 rounded text-sm font-medium bg-site-accent-dark text-white hover:bg-site-accent transition-colors"
                >
                  Add to existing listing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLinkedListingId(null)
                    setHasChosen(true)
                  }}
                  className="px-3 py-1.5 rounded text-sm font-medium border border-site-accent-dark text-site-accent-dark hover:bg-site-accent-light transition-colors"
                >
                  Create new public page
                </button>
              </div>

              <p className="text-xs text-site-muted leading-snug">
                Adding to the existing listing means this part shows as a variant on the existing
                product page. Creating a new page gives it its own URL.
              </p>
            </div>
          </div>
        </div>
      )}

      <form action={action}>
        {/* Always-submitted hidden field for link decision */}
        <input type="hidden" name="linked_listing_id" value={linkedListingId ?? ''} />

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
                  scheduleCheck(e.target.value, manufacturer, visibility)
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
                  scheduleCheck(partNumber, e.target.value, visibility)
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
                  const v = e.target.value as 'public' | 'internal' | 'ebay_only'
                  setVisibility(v)
                  scheduleCheck(partNumber, manufacturer, v)
                }}
                className={selectClass}
              >
                <option value="internal">Internal</option>
                <option value="public">Public</option>
                <option value="ebay_only">eBay Only</option>
              </select>
            </div>
          </div>

          {/* ── Helper text + downstream fields ──────────────────────── */}

          {/* Prompt — only in create mode while gating is incomplete */}
          {!gatingComplete && mode === 'create' && (
            <div className="px-4 py-2 bg-[#f8f5f0]">
              <p className="text-xs text-site-muted">
                Fill in part number, manufacturer, and visibility above to continue.
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
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  readOnly={titleDisabled}
                  className={[
                    'w-full rounded border border-site-border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-site-accent',
                    titleDisabled
                      ? 'bg-[#f8f5f0] text-site-muted cursor-not-allowed'
                      : 'bg-white text-site-text',
                  ].join(' ')}
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
