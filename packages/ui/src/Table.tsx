import type { HTMLAttributes, ReactNode } from 'react'

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
      className={`bg-site-bg border-b border-site-border ${className}`}
      {...props}
    >
      {children}
    </thead>
  )
}

export function TableRow({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`border-b border-site-border last:border-0 ${className}`}
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
      <th className={`px-4 py-3 text-left text-xs font-medium text-site-muted uppercase tracking-wide ${className}`}>
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
