const LOCALE = 'en-US'

/**
 * Canonical date display: MM/DD/YY (e.g. 05/07/26).
 * Returns '--' for null/undefined.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (value == null) return '--'
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleDateString(LOCALE, { year: '2-digit', month: '2-digit', day: '2-digit' })
}

/**
 * Canonical date+time display: MM/DD/YY h:mm A (e.g. 05/07/26 3:42 PM).
 * Returns '--' for null/undefined.
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (value == null) return '--'
  const d = typeof value === 'string' ? new Date(value) : value
  const datePart = d.toLocaleDateString(LOCALE, { year: '2-digit', month: '2-digit', day: '2-digit' })
  const timePart = d.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${datePart} ${timePart}`
}
