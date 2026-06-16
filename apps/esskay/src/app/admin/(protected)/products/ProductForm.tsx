'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { PhotoUploader } from './PhotoUploader'
import { CategoryCombobox } from './CategoryCombobox'
import type { CategoryValue } from './CategoryCombobox'
import { findMatchingPart } from './actions'
import type { MatchedPart } from './actions'
import { productConditionOptions } from '@/lib/product-labels'
import type { ProductCondition } from '@/lib/product-labels'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductFormValues {
  title: string
  sku: string
  part_number: string | null
  vendor: string | null
  google_category_id: string | null
  google_category_path: string | null
  category_label: string | null
  product_type: string | null
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
  'w-full rounded border border-site-border bg-white px-3 py-1.5 text-sm text-site-text focus:outline-none focus:ring-1 focus:ring-site-accent-azure-light'
const selectClass =
  'w-full rounded border border-site-border bg-white px-3 py-1.5 text-sm text-site-text focus:outline-none focus:ring-1 focus:ring-site-accent-azure-light'

// ── Component ─────────────────────────────────────────────────────────────────

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
  const [vendor, setVendor] = useState(initialValues?.vendor ?? '')
  const [category, setCategory] = useState<CategoryValue | null>(
    initialValues?.google_category_id && initialValues?.google_category_path
      ? {
          id: initialValues.google_category_id,
          path: initialValues.google_category_path,
          label: initialValues.category_label ?? '',
        }
      : null
  )
  const [productType, setProductType] = useState(initialValues?.product_type ?? '')
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
  const [conditionNotes, setConditionNotes] = useState(initialValues?.condition_notes ?? '')
  const [summaryValue, setSummaryValue] = useState(initialValues?.description ?? '')

  // ── Photo analysis ───────────────────────────────────────────
  const [photoUrls, setPhotoUrls] = useState<string[]>(initialValues?.photo_urls ?? [])
  const [analyzing, setAnalyzing] = useState(false)
  const [lastAnalysisAt, setLastAnalysisAt] = useState<number | null>(null)
  const analyzedUrlRef = useRef<string | null>(null)

  // ── Derived flags ────────────────────────────────────────────
  const isLinkedNewVariant = linkedListingId !== null && condition === 'new'

  // Lock category/productType when canonical already has category data
  const isMatchLocked = matchResult !== null && (
    matchResult.category_label !== null ||
    matchResult.product_type !== null
  )

  const gatingComplete = mode === 'edit' || (
    partNumber.trim() !== '' &&
    vendor.trim() !== '' &&
    (isLinkedNewVariant || category !== null) &&
    (isLinkedNewVariant || productType.trim() !== '') &&
    visibility !== '' &&
    condition !== ''
  )

  const showBottom = gatingComplete && (
    visibility !== 'public' ||
    !matchResult ||
    storefrontChoice !== 'unchosen'
  )

  const showStorefrontModal =
    visibility === 'public' &&
    matchResult !== null &&
    storefrontChoice === 'unchosen' &&
    gatingComplete

  const showConditionNotes = condition !== 'new' && condition !== ''
  const showSummary = linkedListingId === null
  const qtyError = qtyForSale > qtyOnHand

  // ── Mount: run match check in edit mode ──────────────────────
  useEffect(() => {
    if (!initialValues?.part_number || !initialValues.vendor) return
    const qId = ++latestQueryId.current
    findMatchingPart(
      initialValues.part_number.trim(),
      initialValues.vendor.trim(),
      excludeId
    ).then((match) => {
      if (qId === latestQueryId.current && match) {
        setMatchResult(match)
        setLinkedListingId(match.id)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auto-fill category/productType from canonical ────────────
  useEffect(() => {
    if (!matchResult) return
    const hasCat = matchResult.category_label !== null || matchResult.google_category_id !== null
    const hasPt = matchResult.product_type !== null
    if (!hasCat && !hasPt) return // old canonical — leave editable
    if (hasCat && matchResult.google_category_id && matchResult.google_category_path) {
      setCategory({
        id: matchResult.google_category_id,
        path: matchResult.google_category_path,
        label: matchResult.category_label ?? '',
      })
    }
    if (hasPt) setProductType(matchResult.product_type ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchResult])

  // ── Auto-fill title from part#, vendor, product type ─────────
  useEffect(() => {
    if (isLinkedNewVariant) return
    if (titleValue !== '') return
    const pn = partNumber.trim()
    const vnd = vendor.trim()
    const pt = productType.trim()
    if (pn && vnd && pt) setTitleValue(`${pn} ${vnd} ${pt}`)
  }, [partNumber, vendor, productType, titleValue, isLinkedNewVariant])

  // ── Auto-analyze cover photo; directly fill empty fields ─────
  useEffect(() => {
    if (analyzing) return
    if (photoUrls.length === 0) return
    const url = photoUrls[0]
    if (analyzedUrlRef.current === url) return
    analyzedUrlRef.current = url
    setAnalyzing(true)
    fetch('/api/analyze-photo', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ photoUrl: url }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { suggestions: { title: string | null; part_number: string | null; vendor: string | null; category: CategoryValue | null; product_type: string | null; condition_notes: string | null; summary: string | null } }) => {
        const s = data.suggestions
        // Auto-fill only if the field is currently empty — user input always wins
        const fillPn = s.part_number && !partNumber ? s.part_number : null
        const fillVnd = s.vendor && !vendor ? s.vendor : null
        if (fillPn) setPartNumber(fillPn)
        if (fillVnd) setVendor(fillVnd)
        if (s.category && !category) setCategory(s.category)
        if (s.product_type && !productType) setProductType(s.product_type)
        if (s.title && !titleValue) setTitleValue(s.title)
        if (s.condition_notes && !conditionNotes) setConditionNotes(s.condition_notes)
        if (s.summary && !summaryValue) setSummaryValue(s.summary)
        setLastAnalysisAt(Date.now())
        // Trigger match detection with the effective values
        const effectivePn = fillPn ?? partNumber.trim()
        const effectiveVnd = fillVnd ?? vendor.trim()
        if ((fillPn || fillVnd) && effectivePn && effectiveVnd) {
          scheduleCheck(effectivePn, effectiveVnd)
        }
      })
      .catch((err) => {
        // intentional — surfaces fetch/API failures during development; no user-facing error shown
        console.error('[analyze-photo] failed:', err)
      })
      .finally(() => setAnalyzing(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Intentional stale closure: in create mode all fields are '' at photo-upload time so
    // the "only fill if empty" guards are always accurate. In edit mode, analyzedUrlRef
    // prevents re-runs on subsequent renders, so stale values are never acted on.
  }, [photoUrls])

  function scheduleCheck(pn: string, vnd: string) {
    setMatchResult(null)
    setLinkedListingId(null)
    setStorefrontChoice('unchosen')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const qId = ++latestQueryId.current
    const trimPn = pn.trim()
    const trimVnd = vnd.trim()
    if (!trimPn || !trimVnd) return
    if (
      excludeId &&
      trimPn === (initialValues?.part_number?.trim() ?? '') &&
      trimVnd === (initialValues?.vendor?.trim() ?? '')
    ) {
      return
    }
    debounceRef.current = setTimeout(async () => {
      const match = await findMatchingPart(trimPn, trimVnd, excludeId)
      if (qId === latestQueryId.current) {
        setMatchResult(match)
        setLinkedListingId(match?.id ?? null)
      }
    }, 400)
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <>
      {/* Storefront modal */}
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
                <div className="flex gap-4 mb-5 p-4 rounded border border-site-border bg-site-bg">
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
                    className="w-full rounded px-4 py-2.5 text-sm font-medium text-left bg-site-accent-navy text-white hover:bg-site-accent-navy-dark transition-colors"
                  >
                    Show as a variant on the existing product page
                  </button>
                  <button
                    type="button"
                    onClick={() => setStorefrontChoice('standalone')}
                    className="w-full rounded px-4 py-2.5 text-sm font-medium text-left border border-site-accent-navy text-site-accent-navy hover:bg-site-accent-azure-light transition-colors"
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
        <input
          type="hidden"
          name="google_category_id"
          value={isLinkedNewVariant ? (matchResult?.google_category_id ?? '') : (category?.id ?? '')}
        />
        <input
          type="hidden"
          name="google_category_path"
          value={isLinkedNewVariant ? (matchResult?.google_category_path ?? '') : (category?.path ?? '')}
        />
        <input
          type="hidden"
          name="category_label"
          value={isLinkedNewVariant ? (matchResult?.category_label ?? '') : (category?.label ?? '')}
        />
        {isLinkedNewVariant && (
          <input type="hidden" name="product_type" value={matchResult?.product_type ?? ''} />
        )}

        {/* ── Photos — top of form, drives auto-analysis ────────── */}
        {!isLinkedNewVariant && (
          <div className="rounded-lg border border-site-border overflow-hidden bg-white divide-y divide-site-accent-driftwood-light mb-4">
            <div className="grid grid-cols-3 px-4 py-3 items-start gap-4">
              <span className="text-sm text-site-muted font-medium pt-1.5">Photos</span>
              <div className="col-span-2">
                <PhotoUploader
                  initialPhotoUrls={initialValues?.photo_urls ?? []}
                  onPhotosChange={setPhotoUrls}
                />
                {analyzing && (
                  <p className="text-xs text-site-muted mt-2 animate-pulse">
                    Analyzing photo…
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Auto-fill note ──────────────────────────────────── */}
        {lastAnalysisAt !== null && !isLinkedNewVariant && (
          <p className="text-xs text-site-muted mb-4">
            <span className="text-site-accent-azure-dark mr-1" aria-hidden="true">&#9679;</span>
            Auto-filled from photo analysis. Review and edit anything below as needed.
          </p>
        )}

        {/* ── Top card: gating fields ─────────────────────────── */}
        <div className="rounded-lg border border-site-border overflow-hidden bg-white divide-y divide-site-accent-driftwood-light mb-4">

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
                  scheduleCheck(e.target.value, vendor)
                }}
                className={inputClass}
                placeholder="OEM or aftermarket part number"
              />
            </div>
          </div>

          {/* Vendor */}
          <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
            <label htmlFor="vendor" className="text-sm text-site-muted font-medium">
              Vendor
            </label>
            <div className="col-span-2">
              <input
                id="vendor"
                name="vendor"
                type="text"
                value={vendor}
                onChange={(e) => {
                  setVendor(e.target.value)
                  scheduleCheck(partNumber, e.target.value)
                }}
                className={inputClass}
                placeholder="e.g. Mercruiser"
              />
            </div>
          </div>

          {/* Category — hidden for linked-new variants */}
          {!isLinkedNewVariant && (
            <div className="grid grid-cols-3 px-4 py-3 items-start gap-4">
              <label htmlFor="category" className="text-sm text-site-muted font-medium pt-1.5">
                Category
              </label>
              <div className="col-span-2">
                <CategoryCombobox id="category" value={category} onChange={setCategory} disabled={isMatchLocked} />
                {isMatchLocked && (
                  <p className="text-xs text-site-muted mt-1.5">
                    Category and Product Type are inherited from this part&apos;s existing listing. To change them, edit the canonical product.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Product Type — hidden for linked-new variants */}
          {!isLinkedNewVariant && (
            <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
              <label htmlFor="product_type" className="text-sm text-site-muted font-medium">
                Product Type
              </label>
              <div className="col-span-2">
                <input
                  id="product_type"
                  name="product_type"
                  type="text"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  disabled={isMatchLocked}
                  className={`${inputClass} ${isMatchLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="Specific name (e.g. Oil Filter, Cruising Guide)"
                />
              </div>
            </div>
          )}

          {/* Inherited note for linked-new variants */}
          {isLinkedNewVariant && (
            <div className="px-4 py-3 bg-site-bg">
              <p className="text-xs text-site-muted">
                Category, Product Type, Title, Photos, and Price are inherited from the canonical listing.
              </p>
            </div>
          )}

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
                <option value="" disabled>Select visibility</option>
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
                <option value="" disabled>Select condition</option>
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
            <div className="px-4 py-3 bg-site-accent-azure-light/40">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-site-accent-navy font-semibold">✓</span>
                <div className="flex-1 text-site-text">
                  {storefrontChoice === 'variant' ? (
                    <>
                      Will appear on the storefront as a variant of{' '}
                      <a
                        href={`/admin/products/${matchResult.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-display font-semibold text-site-accent-navy hover:underline"
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
                  className="text-xs text-site-accent-navy hover:underline"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom card: downstream fields ─────────────────────── */}
        {showBottom && (
          <div className="rounded-lg border border-site-border overflow-hidden bg-white divide-y divide-site-accent-driftwood-light mb-6">

            {/* Hidden inputs for linked-new suppressed fields */}
            {isLinkedNewVariant && (
              <>
                <input type="hidden" name="title" value={matchResult?.title ?? ''} />
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
                  Title <span className="text-red-600">*</span>
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
                    placeholder="e.g. GM28351 Kohler Spin-On Oil Filter"
                  />
                </div>
              </div>
            )}

            {/* SKU — always shown */}
            <div className="grid grid-cols-3 px-4 py-3 items-center gap-4">
              <label htmlFor="sku" className="text-sm text-site-muted font-medium">
                SKU <span className="text-red-600">*</span>
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
                  Price (USD) <span className="text-red-600">*</span>
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
                  value={qtyOnHand}
                  onChange={(e) => setQtyOnHand(Math.max(0, parseInt(e.target.value, 10) || 0))}
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
                    value={conditionNotes}
                    onChange={(e) => setConditionNotes(e.target.value)}
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
                    value={summaryValue}
                    onChange={(e) => setSummaryValue(e.target.value)}
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
              'rounded-lg font-body font-semibold transition-colors text-sm px-6 py-[11px] tracking-[0.015em]',
              (mode === 'create' && !showBottom) || qtyError
                ? 'bg-site-border text-site-muted cursor-not-allowed'
                : 'bg-site-accent-navy text-white hover:bg-site-accent-navy-dark',
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
