'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import type { Database } from '@amyv/supabase/types'
import { updateContact } from './actions'

type Customer = Database['public']['Tables']['customers']['Row']

const INPUT_CLS =
  'w-full border border-site-border rounded-lg px-3 py-2 text-sm text-site-text bg-site-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy'

const ACTION_BTN =
  'rounded-xl text-sm font-medium px-4 py-2 bg-site-bg border border-site-accent-dark text-site-accent-dark hover:bg-site-accent-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy disabled:opacity-50'

function formatPhone(phone: string): string {
  const us = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/)
  if (us) return `(${us[1]}) ${us[2]}-${us[3]}`
  return phone
}

function toField(v: string | null | undefined): string {
  return v ?? ''
}

export function ContactCard({ phone, customer }: { phone: string; customer: Customer }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    first_name:    toField(customer.first_name),
    last_name:     toField(customer.last_name),
    email:         toField(customer.email),
    boat_note:     toField(customer.boat_note),
    address_line_1: toField(customer.address_line_1),
    address_line_2: toField(customer.address_line_2),
    city:          toField(customer.city),
    state:         toField(customer.state),
    postal_code:   toField(customer.postal_code),
    country:       toField(customer.country),
  })
  const [formError, setFormError] = useState('')
  const [isPending, startTransition] = useTransition()
  const shouldFocusEditRef = useRef(false)
  const editBtnRef    = useRef<HTMLButtonElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      firstInputRef.current?.focus()
    } else if (shouldFocusEditRef.current) {
      editBtnRef.current?.focus()
      shouldFocusEditRef.current = false
    }
  }, [editing])

  function handleEdit() {
    setDraft({
      first_name:    toField(customer.first_name),
      last_name:     toField(customer.last_name),
      email:         toField(customer.email),
      boat_note:     toField(customer.boat_note),
      address_line_1: toField(customer.address_line_1),
      address_line_2: toField(customer.address_line_2),
      city:          toField(customer.city),
      state:         toField(customer.state),
      postal_code:   toField(customer.postal_code),
      country:       toField(customer.country),
    })
    setFormError('')
    setEditing(true)
  }

  function handleCancel() {
    shouldFocusEditRef.current = true
    setEditing(false)
  }

  function handleSave() {
    setFormError('')
    startTransition(async () => {
      const result = await updateContact(phone, draft)
      if (result.error) {
        setFormError(result.error)
        return
      }
      shouldFocusEditRef.current = true
      setEditing(false)
    })
  }

  function set(key: keyof typeof draft) {
    return (value: string) => setDraft((d) => ({ ...d, [key]: value }))
  }

  const displayName = [customer.first_name, customer.last_name].filter(Boolean).join(' ')

  // ── Display mode ────────────────────────────────────────────────────────────

  if (!editing) {
    return (
      <section aria-labelledby="contact-heading" className="mb-6">
        <h2
          id="contact-heading"
          className="text-lg font-display font-semibold text-site-text mb-3"
        >
          Contact
        </h2>
        <div className="border border-site-border rounded-xl p-6">
          <div className="flex justify-end mb-4">
            <button
              ref={editBtnRef}
              type="button"
              onClick={handleEdit}
              className={ACTION_BTN}
            >
              Edit
            </button>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {displayName && (
              <div>
                <dt className="text-site-muted">Name</dt>
                <dd className="text-site-text font-medium mt-0.5">{displayName}</dd>
              </div>
            )}
            <div>
              <dt className="text-site-muted">Phone</dt>
              <dd className="text-site-text font-mono mt-0.5">{formatPhone(phone)}</dd>
            </div>
            {customer.email && (
              <div>
                <dt className="text-site-muted">Email</dt>
                <dd className="text-site-text mt-0.5">{customer.email}</dd>
              </div>
            )}
            {customer.boat_note && (
              <div className="sm:col-span-2">
                <dt className="text-site-muted">Boat</dt>
                <dd className="text-site-text mt-0.5">{customer.boat_note}</dd>
              </div>
            )}
            {customer.address_line_1 && (
              <div className="sm:col-span-2">
                <dt className="text-site-muted">Address</dt>
                <dd className="text-site-text mt-0.5">
                  {customer.address_line_1}
                  {customer.address_line_2 && <><br />{customer.address_line_2}</>}
                  {(customer.city || customer.state || customer.postal_code) && (
                    <><br />{[customer.city, customer.state, customer.postal_code].filter(Boolean).join(', ')}</>
                  )}
                  {customer.country && customer.country !== 'US' && <><br />{customer.country}</>}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>
    )
  }

  // ── Edit mode ───────────────────────────────────────────────────────────────

  return (
    <section aria-labelledby="contact-heading" className="mb-6">
      <h2
        id="contact-heading"
        className="text-lg font-display font-semibold text-site-text mb-3"
      >
        Contact
      </h2>
      <div className="border border-site-border rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">

          {/* Name row */}
          <div>
            <label htmlFor="cf-first-name" className="block text-xs text-site-muted mb-1">First name</label>
            <input
              ref={firstInputRef}
              id="cf-first-name"
              type="text"
              value={draft.first_name}
              onChange={(e) => set('first_name')(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label htmlFor="cf-last-name" className="block text-xs text-site-muted mb-1">Last name</label>
            <input
              id="cf-last-name"
              type="text"
              value={draft.last_name}
              onChange={(e) => set('last_name')(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          {/* Email */}
          <div className="sm:col-span-2">
            <label htmlFor="cf-email" className="block text-xs text-site-muted mb-1">Email</label>
            <input
              id="cf-email"
              type="email"
              value={draft.email}
              onChange={(e) => set('email')(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          {/* Phone -- read-only */}
          <div className="sm:col-span-2">
            <label htmlFor="cf-phone" className="block text-xs text-site-muted mb-1">Phone</label>
            <input
              id="cf-phone"
              type="tel"
              value={formatPhone(phone)}
              readOnly
              aria-describedby="cf-phone-hint"
              className={`${INPUT_CLS} opacity-60 cursor-not-allowed`}
            />
            <p id="cf-phone-hint" className="text-xs text-site-muted mt-1">
              Phone is the account key and cannot be changed here.
            </p>
          </div>

          {/* Boat */}
          <div className="sm:col-span-2">
            <label htmlFor="cf-boat" className="block text-xs text-site-muted mb-1">Boat</label>
            <textarea
              id="cf-boat"
              value={draft.boat_note}
              onChange={(e) => set('boat_note')(e.target.value)}
              rows={2}
              placeholder="Make, model, year, engine -- anything useful for parts matching"
              className={`${INPUT_CLS} resize-none`}
            />
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label htmlFor="cf-addr1" className="block text-xs text-site-muted mb-1">Address line 1</label>
            <input
              id="cf-addr1"
              type="text"
              value={draft.address_line_1}
              onChange={(e) => set('address_line_1')(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cf-addr2" className="block text-xs text-site-muted mb-1">Address line 2</label>
            <input
              id="cf-addr2"
              type="text"
              value={draft.address_line_2}
              onChange={(e) => set('address_line_2')(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label htmlFor="cf-city" className="block text-xs text-site-muted mb-1">City</label>
            <input
              id="cf-city"
              type="text"
              value={draft.city}
              onChange={(e) => set('city')(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label htmlFor="cf-state" className="block text-xs text-site-muted mb-1">State</label>
            <input
              id="cf-state"
              type="text"
              value={draft.state}
              onChange={(e) => set('state')(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label htmlFor="cf-postal" className="block text-xs text-site-muted mb-1">Postal code</label>
            <input
              id="cf-postal"
              type="text"
              value={draft.postal_code}
              onChange={(e) => set('postal_code')(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label htmlFor="cf-country" className="block text-xs text-site-muted mb-1">Country</label>
            <input
              id="cf-country"
              type="text"
              value={draft.country}
              onChange={(e) => set('country')(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
        </div>

        {formError && (
          <p role="alert" className="text-sm text-site-accent-coral-dark mt-4">{formError}</p>
        )}

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-site-border">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className={ACTION_BTN}
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="text-sm text-site-muted hover:text-site-text rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy"
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  )
}
