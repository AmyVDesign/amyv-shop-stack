import type { HTMLAttributes, ReactNode } from 'react'

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Adds hover highlight for clickable rows (mouse affordance).
   *  The primary cell MUST contain a real <a> or <button> as the keyboard
   *  target; the row onClick is for mouse users only and must not be the
   *  sole path to the destination. */
  interactive?: boolean
}

export function Table({ children, className = '', ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={`w-full text-sm border-collapse ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export function TableHeader({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`border-b border-site-border ${className}`}
      {...props}
    >
      {children}
    </thead>
  )
}

export function TableRow({
  children,
  className = '',
  interactive = false,
  ...props
}: TableRowProps) {
  return (
    <tr
      className={`border-b border-site-border last:border-0${interactive ? ' cursor-pointer hover:bg-site-bg/60 transition-colors' : ''} ${className}`}
      {...props}
    >
      {children}
    </tr>
  )
}

interface TableCellProps {
  children?: ReactNode
  header?: boolean
  className?: string
}

export function TableCell({ children, header = false, className = '' }: TableCellProps) {
  if (header) {
    return (
      <th scope="col" className={`px-4 py-3 text-left text-xs font-medium text-site-muted uppercase tracking-wide ${className}`}>
        {children}
      </th>
    )
  }
  return (
    <td className={`px-4 py-3 align-middle text-site-text ${className}`}>
      {children}
    </td>
  )
}
