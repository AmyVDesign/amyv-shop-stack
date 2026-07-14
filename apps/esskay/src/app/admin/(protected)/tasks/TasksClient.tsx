'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import type { MouseEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Table, TableHeader, TableRow, TableCell,
  SearchInput, FilterDropdown, ResultCount, DataToolbar,
} from '@amyv/ui'
import { formatDate } from '@/lib/format'
import { completeTask } from './actions'
import type { TaskWithCustomer } from './page'
import type { Database } from '@amyv/supabase/types'

type TaskType = Database['public']['Enums']['task_type']

const TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: 'call_back',   label: 'Call back' },
  { value: 'refund',      label: 'Refund' },
  { value: 'follow_up',   label: 'Follow up' },
  { value: 'order_issue', label: 'Order issue' },
  { value: 'other',       label: 'Other' },
]

const TYPE_LABEL: Record<TaskType, string> = {
  call_back:   'Call back',
  refund:      'Refund',
  follow_up:   'Follow up',
  order_issue: 'Order issue',
  other:       'Other',
}

function displayName(c: TaskWithCustomer['customers']): string {
  if (!c) return '(unknown)'
  const name = [c.first_name, c.last_name].filter(Boolean).join(' ')
  return name || c.phone
}

export function TasksClient({ tasks }: { tasks: TaskWithCustomer[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebounced] = useState('')
  const [typeSelected, setTypeSelected] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200)
    return () => clearTimeout(t)
  }, [query])

  const filtered = useMemo(() => {
    let r = tasks.slice()

    if (typeSelected.length > 0) {
      r = r.filter((t) => typeSelected.includes(t.type))
    }

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase()
      r = r.filter(
        (t) =>
          t.body.toLowerCase().includes(q) ||
          displayName(t.customers).toLowerCase().includes(q) ||
          (t.customers?.phone ?? '').includes(q),
      )
    }

    return r
  }, [tasks, debouncedQuery, typeSelected])

  function handleComplete(e: MouseEvent, task: TaskWithCustomer) {
    e.stopPropagation()
    const phone = task.customers?.phone
    if (!phone) return
    setPendingId(task.id)
    setActionError(null)
    startTransition(async () => {
      const result = await completeTask(task.id, phone)
      if (result.error) {
        setActionError({ id: task.id, message: result.error })
      }
      setPendingId(null)
    })
  }

  return (
    <div>
      <DataToolbar>
        <SearchInput
          value={query}
          onChange={setQuery}
          aria-label="Search tasks"
          placeholder="Search by task or customer"
          className="w-full sm:w-[320px]"
        />
        <FilterDropdown
          label="Type"
          options={TYPE_OPTIONS}
          selected={typeSelected}
          onChange={setTypeSelected}
        />
      </DataToolbar>

      <ResultCount shown={filtered.length} total={tasks.length} noun="tasks" />

      {tasks.length === 0 ? (
        <p className="text-sm text-site-muted">No open tasks.</p>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-site-muted">No tasks match your filters.</p>
      ) : (
        <div className="rounded-xl border border-site-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-0">
                <TableCell header>Task</TableCell>
                <TableCell header>Customer</TableCell>
                <TableCell header>Created</TableCell>
                <TableCell header><span className="sr-only">Actions</span></TableCell>
              </TableRow>
            </TableHeader>
            <tbody>
              {filtered.map((task) => {
                const c = task.customers
                const phone = c?.phone ?? ''
                const href = phone ? `/admin/customers/${encodeURIComponent(phone)}` : '#'
                const name = displayName(c)
                const isThisRowPending = pendingId === task.id && isPending
                const error = actionError?.id === task.id ? actionError.message : null

                return (
                  <TableRow
                    key={task.id}
                    interactive
                    onClick={() => { if (phone) router.push(href) }}
                  >
                    <TableCell>
                      <p className="text-xs font-medium uppercase tracking-wide text-site-muted mb-0.5">
                        {TYPE_LABEL[task.type]}
                      </p>
                      <p className="text-site-text">{task.body}</p>
                      {error && (
                        <p role="alert" className="text-xs text-site-danger mt-1">{error}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-site-text hover:text-site-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded"
                      >
                        {name}
                      </Link>
                      {phone && (
                        <p className="font-mono text-xs text-site-muted mt-0.5">{phone}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span>{formatDate(task.created_at)}</span>
                      {task.created_by && (
                        <p className="text-xs text-site-muted mt-0.5">{task.created_by}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        disabled={isPending}
                        aria-label={`Mark done: task for ${name}`}
                        onClick={(e) => handleComplete(e, task)}
                        className="text-xs font-medium px-2.5 py-1 border border-site-border rounded-lg text-site-muted hover:text-site-text hover:border-site-accent-dark/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {isThisRowPending ? 'Saving...' : 'Mark done'}
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  )
}
