'use client'

import { useState, useId } from 'react'
import { Table, TableHeader, TableRow, TableCell } from '@amyv/ui'
import type { Database } from '@amyv/supabase/types'

type CustomerTask   = Database['public']['Tables']['customer_tasks']['Row']
type CustomerChange = Database['public']['Tables']['customer_changes']['Row']

const TASK_TYPE_LABEL: Record<string, string> = {
  call_back:   'Call back',
  refund:      'Refund',
  follow_up:   'Follow up',
  order_issue: 'Order issue',
  other:       'Other',
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year:  '2-digit',
    month: '2-digit',
    day:   '2-digit',
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  })
}

interface Props {
  tasks:   CustomerTask[]
  changes: CustomerChange[]
}

export function HistoryAccordion({ tasks, changes }: Props) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const total = tasks.length + changes.length

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
            ({total} {total === 1 ? 'event' : 'events'})
          </span>
        </button>
      </h2>

      <div id={panelId} hidden={!open} className="space-y-8">

        {/* Task History */}
        <section aria-labelledby="task-history-heading">
          <h3
            id="task-history-heading"
            className="text-xs font-medium text-site-muted uppercase tracking-wide mb-3"
          >
            Task History
          </h3>
          {tasks.length === 0 ? (
            <p className="text-sm text-site-muted">No tasks yet.</p>
          ) : (
            <ul className="space-y-3">
              {tasks
                .slice()
                .sort((a, b) => Date.parse(b.completed_at ?? b.created_at) - Date.parse(a.completed_at ?? a.created_at))
                .map((task) => (
                  <li key={task.id} className="border border-site-border rounded-xl p-4 opacity-70">
                    <p className="text-xs font-medium text-site-muted uppercase tracking-wide mb-1">
                      {TASK_TYPE_LABEL[task.type] ?? task.type}
                    </p>
                    <p className="text-sm text-site-text mb-3">{task.body}</p>
                    <div className="grid grid-cols-3 text-xs text-site-muted border-t border-site-border pt-3">
                      <span>
                        <span className="block text-[10px] text-site-muted/70 uppercase tracking-wide mb-0.5">Date Created</span>
                        {formatShortDate(task.created_at)}
                      </span>
                      <span className="text-center">
                        <span className="block text-[10px] text-site-muted/70 uppercase tracking-wide mb-0.5">Date Completed</span>
                        {task.completed_at ? formatShortDate(task.completed_at) : '--'}
                      </span>
                      <span className="text-right">
                        <span className="block text-[10px] text-site-muted/70 uppercase tracking-wide mb-0.5">Completed By</span>
                        {task.completed_by ?? <span className="italic">(unknown)</span>}
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </section>

        {/* Contact History */}
        <section aria-labelledby="contact-history-heading">
          <h3
            id="contact-history-heading"
            className="text-xs font-medium text-site-muted uppercase tracking-wide mb-3"
          >
            Contact History
          </h3>
          {changes.length === 0 ? (
            <p className="text-sm text-site-muted">No changes yet.</p>
          ) : (
            <div className="border border-site-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Original &rarr; New</TableCell>
                    <TableCell header>Date Changed</TableCell>
                    <TableCell header>Changed By</TableCell>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {changes
                    .slice()
                    .sort((a, b) => Date.parse(b.changed_at) - Date.parse(a.changed_at))
                    .map((change) => (
                      <TableRow key={change.id}>
                        <TableCell>
                          <span className="block text-xs text-site-muted mb-0.5">{change.field}</span>
                          <span className={change.old_value ? 'text-sm text-site-text' : 'text-sm text-site-muted italic'}>
                            {change.old_value ?? '(empty)'}
                          </span>
                          {' → '}
                          <span className={change.new_value ? 'text-sm text-site-text' : 'text-sm text-site-muted italic'}>
                            {change.new_value ?? '(empty)'}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(change.changed_at)}</TableCell>
                        <TableCell>{change.changed_by ?? 'Staff'}</TableCell>
                      </TableRow>
                    ))}
                </tbody>
              </Table>
            </div>
          )}
        </section>

      </div>
    </section>
  )
}
