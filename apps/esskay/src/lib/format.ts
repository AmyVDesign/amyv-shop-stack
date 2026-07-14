const LOCALE = 'en-US'

/**
 * Canonical currency display: $1,234.56.
 * Accepts a value in cents.
 */
export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString(LOCALE, { style: 'currency', currency: 'USD' })
}

/**
 * Canonical phone display: (315) 555-1234 for US numbers, raw E.164 otherwise.
 */
export function formatPhone(phone: string): string {
  const us = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/)
  if (us) return `(${us[1]}) ${us[2]}-${us[3]}`
  return phone
}

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
