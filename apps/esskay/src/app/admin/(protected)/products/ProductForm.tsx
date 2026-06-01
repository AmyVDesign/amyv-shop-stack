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
}: ProductFormProps) {
  // Controlled state for fields used in match detection + the decision prompt
  const [partNumber, setPartNumber] = useState(initialValues?.part_number ?? '')
  const [manufacturer, setManufacturer] = useState(initialValues?.manufacturer ?? '')
  const [visibility, setVisibility] = useState<'public' | 'internal' | 'ebay_only'>(
    initialValues?.visibility ?? 'internal'
  )

  // Match detection state
  const [matchResult, setMatchResult] = useState<MatchedPart | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestQueryId = useRef(0)

  // Link decision state
  // linkedListingId: what we submit. Null = standalone. String = linked.
  const [linkedListingId, setLinkedListingId] = useState<string | null>(
    initialValues?.linked_listing_id ?? null
  )
  // hasChosen: whether to show a button as visually "selected".
  // True in edit mode (current state is always a choice) or after user clicks.
  const [hasChosen, setHasChosen] = useState(mode === 'edit')

  // On mount in edit mode: if the part has a link, run the check once so the section appears
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

  function scheduleCheck(pn: string, mfr: string) {
    setMatchResult(null)
    setHasChosen(false)
    setLinkedListingId(null)  // Clear any prior link decision when fields change
    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Bump ID before early returns so in-flight queries don't overwrite cleared state
    const qId = ++latestQueryId.current

    const trimPn = pn.trim()
    const trimMfr = mfr.trim()
    if (!trimPn || !trimMfr) return

    // Edit mode: skip if values haven't changed from initial (avoids noisy check on first load)
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

  const linkSelected = hasChosen && linkedListingId === matchResult?.id
  const standaloneSelected = hasChosen && linkedListingId === null

  return (
    <>
      {errorMessage && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          {errorMessage}
        </div>
      )}

      <form action={action}>
        {/* Always-submitted hidden field for link decision */}
        <input
          type="hidden"
          name="linked_listing_id"
          value={linkedListingId ?? ''}
        />

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

          {/* Visibility — controlled so match section hides when not public */}
          <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
            <label htmlFor="visibility" className="text-sm text-site-muted font-medium">
              Visibility
            </label>
            <div className="col-span-2">
              <select
                id="visibility"
                name="visibility"
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as 'public' | 'internal' | 'ebay_only')
                }
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

        {/* Match review section — only when public + match found */}
        {matchResult && visibility === 'public' && (
          <div className="rounded-lg border border-site-border overflow-hidden bg-[#e8f0f8] mb-6">
            <div className="px-4 py-4 space-y-4">
              <p className="text-sm font-semibold text-site-accent-dark">
                We found an existing public listing for this part
              </p>

              {/* Match details */}
              <div className="flex gap-4 items-start">
                {/* Photo thumbnail */}
                {matchResult.photo_urls.length > 0 ? (
                  <img
                    src={matchResult.photo_urls[0]}
                    alt={matchResult.title}
                    className="w-20 h-20 rounded object-cover flex-shrink-0 border border-site-border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded flex-shrink-0 bg-[#f8f5f0] border border-site-border" />
                )}

                {/* Info column */}
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

                  <a
                    href={`/admin/products/${matchResult.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-site-accent hover:underline"
                  >
                    View full part →
                  </a>
                </div>
              </div>

              <div className="border-t border-[#c8d8e8]" />

              {/* Decision section */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-site-accent-dark">
                  How should this new listing appear publicly?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLinkedListingId(matchResult.id)
                      setHasChosen(true)
                    }}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
                      linkSelected
                        ? 'bg-site-accent-dark text-white'
                        : 'border border-site-accent-dark text-site-accent-dark hover:bg-site-accent-light',
                    ].join(' ')}
                  >
                    {linkSelected && <span aria-hidden="true">✓</span>}
                    Add to existing listing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkedListingId(null)
                      setHasChosen(true)
                    }}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
                      standaloneSelected
                        ? 'bg-site-accent-dark text-white'
                        : 'border border-site-accent-dark text-site-accent-dark hover:bg-site-accent-light',
                    ].join(' ')}
                  >
                    {standaloneSelected && <span aria-hidden="true">✓</span>}
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
