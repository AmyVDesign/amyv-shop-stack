'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { updateBoatNote } from './actions'

const MAX = 1000
const TEXTAREA_ID = 'boat-note-textarea'
const COUNTER_ID = 'boat-note-counter'

const ACTION_BTN =
  'rounded-xl text-sm font-medium px-4 py-2 bg-site-bg border border-site-accent-dark text-site-accent-dark hover:bg-site-accent-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy disabled:opacity-50'

interface BoatNoteProps {
  phone: string
  initialNote: string | null
}

export function BoatNote({ phone, initialNote }: BoatNoteProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialNote ?? '')
  const [shouldFocusEdit, setShouldFocusEdit] = useState(false)
  const [isPending, startTransition] = useTransition()
  const editBtnRef = useRef<HTMLButtonElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) textareaRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!editing && shouldFocusEdit) {
      editBtnRef.current?.focus()
      setShouldFocusEdit(false)
    }
  }, [editing, shouldFocusEdit])

  function handleEdit() {
    setDraft(initialNote ?? '')
    setEditing(true)
  }

  function handleCancel() {
    setShouldFocusEdit(true)
    setEditing(false)
  }

  function handleSave() {
    startTransition(async () => {
      await updateBoatNote(phone, draft)
      setShouldFocusEdit(true)
      setEditing(false)
    })
  }

  const len = draft.length

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-4">
        {initialNote ? (
          <p className="text-sm text-site-text">{initialNote}</p>
        ) : (
          <p className="text-sm text-site-muted italic">No boat note yet.</p>
        )}
        <button
          ref={editBtnRef}
          type="button"
          onClick={handleEdit}
          className={ACTION_BTN}
        >
          {initialNote ? 'Edit' : 'Add note'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label htmlFor={TEXTAREA_ID} className="sr-only">
        Boat note
      </label>
      <textarea
        ref={textareaRef}
        id={TEXTAREA_ID}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        aria-describedby={COUNTER_ID}
        rows={3}
        placeholder="Make, model, year, engine -- anything useful for parts matching"
        className="w-full border border-site-border rounded-lg px-3 py-2 text-sm text-site-text bg-site-bg resize-none focus:outline-none focus:ring-2 focus:ring-site-accent-navy"
      />
      <div className="flex items-center justify-between gap-2">
        <p id={COUNTER_ID} className="text-xs text-site-muted">{len}/{MAX}</p>
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || len > MAX}
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
    </div>
  )
}
