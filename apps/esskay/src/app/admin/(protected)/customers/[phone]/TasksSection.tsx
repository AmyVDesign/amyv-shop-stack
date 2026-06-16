'use client'

import { useState, useTransition, useEffect } from 'react'
import { createTask, completeTask } from './actions'
import type { Database } from '@amyv/supabase/types'

type CustomerTask = Database['public']['Tables']['customer_tasks']['Row']
type TaskType = Database['public']['Enums']['task_type']

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'call_back', label: 'Call back' },
  { value: 'refund', label: 'Refund' },
  { value: 'follow_up', label: 'Follow up' },
  { value: 'order_issue', label: 'Order issue' },
  { value: 'other', label: 'Other' },
]

const TASK_TYPE_LABEL: Record<TaskType, string> = {
  call_back: 'Call back',
  refund: 'Refund',
  follow_up: 'Follow up',
  order_issue: 'Order issue',
  other: 'Other',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface TasksSectionProps {
  phone: string
  openTasks: CustomerTask[]
}

export function TasksSection({ phone, openTasks }: TasksSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<TaskType>('call_back')
  const [body, setBody] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [formError, setFormError] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!confirmation) return
    const t = setTimeout(() => setConfirmation(''), 4000)
    return () => clearTimeout(t)
  }, [confirmation])

  function resetForm() {
    setType('call_back')
    setBody('')
    setFormError('')
    setShowForm(false)
  }

  function handleCreate() {
    setFormError('')
    startTransition(async () => {
      const result = await createTask(phone, type, body)
      if (result.error) {
        setFormError(result.error)
        return
      }
      resetForm()
      setConfirmation('Task created.')
    })
  }

  function handleComplete(taskId: string) {
    startTransition(async () => {
      await completeTask(taskId, phone)
    })
  }

  const bodyLen = body.length
  const counterId = 'task-body-counter'
  const bodyId = 'task-body'
  const typeId = 'task-type'

  return (
    <section aria-labelledby="tasks-heading">
      <div className="flex items-center justify-between mb-4">
        <h2
          id="tasks-heading"
          className="text-lg font-display font-semibold text-site-text"
        >
          Tasks
        </h2>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-site-accent-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy rounded"
          >
            Add task
          </button>
        )}
      </div>

      {/* aria-live region for confirmation messages */}
      <div
        role="status"
        aria-live="polite"
        className={confirmation ? 'text-sm text-site-accent-azure-dark mb-4' : 'sr-only'}
        aria-atomic="true"
      >
        {confirmation}
      </div>

      {showForm && (
        <div className="border border-site-border rounded-xl p-4 mb-4 bg-site-bg-alt">
          <div className="space-y-3">
            <div>
              <label
                htmlFor={typeId}
                className="block text-sm font-medium text-site-text mb-1"
              >
                Type <span aria-hidden="true" className="text-site-accent-coral-dark">*</span>
              </label>
              <select
                id={typeId}
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full border border-site-border rounded-lg px-3 py-2 text-sm text-site-text bg-site-bg focus:outline-none focus:ring-2 focus:ring-site-accent-navy"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor={bodyId}
                className="block text-sm font-medium text-site-text mb-1"
              >
                Notes <span aria-hidden="true" className="text-site-accent-coral-dark">*</span>
              </label>
              <textarea
                id={bodyId}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                aria-describedby={counterId}
                rows={3}
                placeholder="What needs to happen?"
                className="w-full border border-site-border rounded-lg px-3 py-2 text-sm text-site-text bg-site-bg resize-none focus:outline-none focus:ring-2 focus:ring-site-accent-navy"
              />
              <p id={counterId} className="text-xs text-site-muted mt-1 text-right">
                {bodyLen}/500
              </p>
            </div>

            {formError && (
              <p role="alert" className="text-sm text-site-accent-coral-dark">
                {formError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={isPending || bodyLen === 0 || bodyLen > 500}
                className="px-4 py-2 text-sm font-medium bg-site-accent-dark text-site-bg rounded-lg hover:bg-site-accent disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy transition-colors"
              >
                {isPending ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-site-muted hover:text-site-text rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {openTasks.length === 0 && !showForm && (
        <p className="text-sm text-site-muted">No open tasks.</p>
      )}

      <ul className="space-y-3">
        {openTasks.map((task) => (
          <li
            key={task.id}
            className="border border-site-border rounded-xl p-4 bg-site-bg-alt"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-site-accent-dark uppercase tracking-wide mb-1">
                  {TASK_TYPE_LABEL[task.type]}
                </p>
                <p className="text-sm text-site-text">{task.body}</p>
                <p className="text-xs text-site-muted mt-1.5">
                  {task.created_by ?? 'Staff'} &middot; {formatDate(task.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleComplete(task.id)}
                disabled={isPending}
                className="flex-none text-xs font-medium px-2.5 py-1 border border-site-border rounded-lg text-site-muted hover:text-site-text hover:border-site-accent-dark/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy transition-colors disabled:opacity-50"
              >
                Mark done
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
