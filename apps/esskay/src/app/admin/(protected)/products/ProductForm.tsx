'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { PhotoUploader } from './PhotoUploader'
import { findMatchingPart } from './actions'
import type { MatchedPart } from './actions'
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
  condition_notes: string | null
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
  // ── Gating fields ───────────────────────────────────────────
  const [partNumber, setPartNumber] = useState(initialValues?.part_number ?? '')
  const [manufacturer, setManufacturer] = useState(initialValues?.manufacturer ?? '')
  const [visibility, setVisibility] = useState<'public' | 'internal' | 'ebay_only' | ''>(
    mode === 'edit' ? (initialValues?.visibility ?? 'internal') : ''
  )
  const [condition, setCondition] = useState<ProductCondition | ''>(
    initialValues?.condition ?? ''
  )

  // ── Storefront display choice ────────────────────────────────
  const [storefrontChoice, setStorefrontChoice] = useState<'unchosen' | 'variant' | 'standalone'>(
    initialValues?.standalone_listing
      ? 'standalone'
      : initialValues?.linked_listing_id
        ? 'variant'
        : 'unchosen'
  )

  // ── Match detection ─────────────────────────────────────────
  const [matchResult, setMatchResult] = useState<MatchedPart | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestQueryId = useRef(0)

  // ── Auto-link ───────────────────────────────────────────────
  const [linkedListingId, setLinkedListingId] = useState<string | null>(
    initialValues?.linked_listing_id ?? null
  )

  // ── Editable downstream state ────────────────────────────────
  const [titleValue, setTitleValue] = useState(initialValues?.title ?? '')
  const [priceValue, setPriceValue] = useState(
    initialValues ? (initialValues.price_cents / 100).toFixed(2) : ''
  )
  const [qtyOnHand, setQtyOnHand] = useState(initialValues?.qty_on_hand ?? 0)
  const [qtyForSale, setQtyForSale] = useState(initialValues?.qty_for_sale ?? 0)

  // ── Derived display flags ────────────────────────────────────
  const gatingComplete = mode === 'edit' || (
    partNumber.trim() !== '' &&
    manufacturer.trim() !== '' &&
    visibility !== '' &&
    condition !== ''
  )

  const showBottom = gatingComplete && (
    visibility !== 'public' ||
    !matchResult ||
    storefrontChoice !== 'unchosen'
  )

  // Linked + New: fields that differ from a fully custom listing
  const isLinkedNewVariant = linkedListingId !== null && condition === 'new'

  const showStorefrontModal =
    visibility === 'public' &&
    matchResult !== null &&
    storefrontChoice === 'unchosen' &&
    gatingComplete

  const showConditionNotes = condition !== 'new' && condition !== ''
  const showSummary = linkedListingId === null
  const qtyError = qtyForSale > qtyOnHand

  // ── Mount effect: run match check in edit mode ───────────────
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

  function scheduleCheck(pn: string, mfr: string) {
    setMatchResult(null)
    setLinkedListingId(null)
    setStorefrontChoice('unchosen')

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const qId = ++latestQueryId.current

    const trimPn = pn.trim()
    const trimMfr = mfr.trim()
    if (!trimPn || !trimMfr) return

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
        <input type="hidden" name="linked_listing_id" value={linkedListingId ?? ''} />
        <input type="hidden" name="standalone_listing" value={storefrontChoice === 'standalone' ? 'true' : 'false'} />

        {/* ── Top card: gating fields (always visible) ─────────────── */}
        <div className="rounded-lg border border-site-border overflow-hidden bg-white divide-y divide-site-border mb-4">

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
                <option value="" disabled>— Select visibility —</option>
                <option value="internal">Internal</option>
                <option value="public">Public</option>
                <option value="ebay_only">eBay Only</option>
              </select>
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
                value={condition}
                onChange={(e) => setCondition(e.target.value as ProductCondition | '')}
                className={selectClass}
              >
                <option value="" disabled>— Select condition —</option>
                {productConditionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Storefront choice confirmation pill */}
          {visibility === 'public' && matchResult && storefrontChoice !== 'unchosen' && (
            <div className="px-4 py-3 bg-[#e8f0f8]">
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
        </div>

        {/* ── Bottom card: downstream fields (only when showBottom) ─── */}
        {showBottom && (
          <div className="rounded-lg border border-site-border overflow-hidden bg-white divide-y divide-site-border mb-6">

            {/* Hidden inputs for suppressed fields */}
            {isLinkedNewVariant && (
              <>
                <input
                  type="hidden"
                  name="title"
                  value={matchResult?.title ?? ''}
                />
                <input
                  type="hidden"
                  name="price"
                  value={matchResult ? (matchResult.price_cents / 100).toFixed(2) : '0.00'}
                />
              </>
            )}

            {/* Title — hidden for linked-new variants */}
            {!isLinkedNewVariant && (
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
                    className={inputClass}
                    placeholder="e.g. Mercruiser water pump impeller"
                  />
                </div>
              </div>
            )}

            {/* Photos — hidden for linked-new variants */}
            {!isLinkedNewVariant && (
              <div className="grid grid-cols-3 px-4 py-3 items-start gap-4">
                <span className="text-sm text-site-muted font-medium pt-1.5">Photos</span>
                <div className="col-span-2">
                  <PhotoUploader initialPhotoUrls={initialValues?.photo_urls ?? []} />
                </div>
              </div>
            )}

            {/* SKU — always shown */}
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

            {/* Price — hidden for linked-new variants */}
            {!isLinkedNewVariant && (
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
                    value={priceValue}
                    onChange={(e) => setPriceValue(e.target.value)}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {/* Qty On Hand — always shown */}
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
                  value={qtyOnHand}
                  onChange={(e) => setQtyOnHand(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Qty For Sale — always shown */}
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
                  max={qtyOnHand}
                  step="1"
                  value={qtyForSale}
                  onChange={(e) => setQtyForSale(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className={[inputClass, qtyError ? 'border-red-500' : ''].join(' ').trim()}
                />
                {qtyError && (
                  <p className="text-xs text-red-600 mt-1">
                    For Sale cannot exceed On Hand ({qtyOnHand})
                  </p>
                )}
              </div>
            </div>

            {/* Condition Summary — non-new conditions only */}
            {showConditionNotes && (
              <div className="grid grid-cols-3 px-4 py-3 items-start gap-4">
                <label htmlFor="condition_notes" className="text-sm text-site-muted font-medium pt-1.5">
                  Condition Summary
                </label>
                <div className="col-span-2">
                  <textarea
                    id="condition_notes"
                    name="condition_notes"
                    rows={2}
                    defaultValue={initialValues?.condition_notes ?? ''}
                    className={`${inputClass} resize-none`}
                    placeholder="Describe the specific condition: minor patina, missing hardware, light pitting, etc."
                  />
                </div>
              </div>
            )}

            {/* Summary — canonical/standalone listings only */}
            {showSummary && (
              <div className="grid grid-cols-3 px-4 py-3 items-start gap-4">
                <label htmlFor="description" className="text-sm text-site-muted font-medium pt-1.5">
                  Summary
                </label>
                <div className="col-span-2">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    defaultValue={initialValues?.description ?? ''}
                    className={`${inputClass} resize-none`}
                    placeholder="Describe this product (visible on the storefront)"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={(mode === 'create' && !showBottom) || qtyError}
            className={[
              'rounded font-body font-medium transition-colors text-sm px-4 py-2',
              (mode === 'create' && !showBottom) || qtyError
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
