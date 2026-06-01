'use client'

import { updatePart } from './actions'
import { ProductForm } from '../ProductForm'
import type { ProductFormValues } from '../ProductForm'

interface Props {
  listing: ProductFormValues & { id: string }
  canonicalId: string
  onClose: () => void
}

export function EditListingModal({ listing, canonicalId, onClose }: Props) {
  const action = updatePart.bind(null, listing.id, canonicalId)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center py-8 px-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal panel */}
        <div className="relative w-full max-w-2xl bg-white rounded-lg border border-site-border shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-site-border">
            <h2 className="text-lg font-display font-semibold text-site-text">Edit Listing</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-site-muted hover:text-site-text transition-colors text-xl leading-none"
            >
              ✕
            </button>
          </div>
          <div className="px-6 py-6">
            <ProductForm
              mode="edit"
              initialValues={listing}
              action={action}
              submitLabel="Save Changes"
              cancelHref="#"
              excludeId={listing.id}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
