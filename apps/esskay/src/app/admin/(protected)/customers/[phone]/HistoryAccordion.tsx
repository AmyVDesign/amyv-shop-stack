'use client'

import { useState } from 'react'
import type { Database } from '@amyv/supabase/types'

type CustomerTask   = Database['public']['Tables']['customer_tasks']['Row']
type CustomerChange = Database['public']['Tables']['customer_changes']['Row']

const TASK_TYPE_LABEL: Record<string, string> = {
  call_back:    'Call back',
  refund:       'Refund',
  follow_up:    'Follow up',
  order_issue:  'Order issue',
  other:        'Other',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  })
}

type Entry =
  | { kind: 'task';   date: string; data: CustomerTask }
  | { kind: 'change'; date: string; data: CustomerChange }

interface Props {
  tasks:   CustomerTask[]
  changes: CustomerChange[]
}

export function HistoryAccordion({ tasks, changes }: Props) {
  const [open, setOpen] = useState(false)
  const panelId = 'history-panel'

  const entries: Entry[] = [
    ...tasks.map((t): Entry => ({ kind: 'task',   date: t.completed_at ?? t.created_at, data: t })),
    ...changes.map((c): Entry => ({ kind: 'change', date: c.changed_at, data: c })),
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))

  const count = entries.length

  return (
    <section aria-labelledby="history-heading">
      <h2 id="history-heading" className="text-lg font-display font-semibold text-site-text mb-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex items-center gap-2 hover:text-site-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded"
        >
          <span aria-hidden="true" className="text-sm font-normal">
            {open ? '▾' : '▸'}
          </span>
          History
          <span className="text-base font-normal text-site-muted">
            ({count} {count === 1 ? 'event' : 'events'})
          </span>
        </button>
      </h2>

      <div id={panelId} hidden={!open}>
        <ul className="space-y-3">
          {entries.map((entry) => {
            if (entry.kind === 'task') {
              const task = entry.data
              return (
                <li key={`task-${task.id}`} className="border border-site-border rounded-xl p-4 opacity-70">
                  <p className="text-xs font-medium text-site-muted uppercase tracking-wide mb-1">
                    {TASK_TYPE_LABEL[task.type] ?? task.type}
                  </p>
                  <p className="text-sm text-site-text">{task.body}</p>
                  <p className="text-xs text-site-muted mt-1.5">
                    {task.created_by ?? 'Staff'} &middot; {formatDate(task.created_at)}
                    {task.completed_at && <> &middot; Done {formatDate(task.completed_at)}</>}
                  </p>
                </li>
              )
            }

            const change = entry.data
            const oldVal = change.old_value
            const newVal = change.new_value
            return (
              <li key={`change-${change.id}`} className="border border-site-border rounded-xl p-4 opacity-70">
                <p className="text-xs font-medium text-site-muted uppercase tracking-wide mb-1">
                  {change.field} changed
                </p>
                <p className="text-sm text-site-text">
                  <span className={oldVal ? undefined : 'text-site-muted italic'}>
                    {oldVal ?? '(empty)'}
                  </span>
                  {' → '}
                  <span className={newVal ? undefined : 'text-site-muted italic'}>
                    {newVal ?? '(empty)'}
                  </span>
                </p>
                <p className="text-xs text-site-muted mt-1.5">
                  {change.changed_by ?? 'Staff'} &middot; {formatDate(change.changed_at)}
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
