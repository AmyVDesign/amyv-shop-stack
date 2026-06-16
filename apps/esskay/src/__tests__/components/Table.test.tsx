// Contrast is verified in the Playwright e2e layer, not here,
// because jsdom does not compute CSS custom property styles.
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { Table, TableHeader, TableRow, TableCell } from '@amyv/ui'

function SampleTable() {
  return (
    <Table aria-label="Sample parts table">
      <TableHeader>
        <TableRow>
          <TableCell header>Part No.</TableCell>
          <TableCell header>Description</TableCell>
          <TableCell header>Price</TableCell>
        </TableRow>
      </TableHeader>
      <tbody>
        <TableRow>
          <TableCell>147-0831</TableCell>
          <TableCell>Carburetor</TableCell>
          <TableCell>$285.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>167-1185</TableCell>
          <TableCell>Voltage Regulator</TableCell>
          <TableCell>$95.00</TableCell>
        </TableRow>
      </tbody>
    </Table>
  )
}

describe('Table accessibility', () => {
  it('has no axe violations with sample rows', async () => {
    const { container } = render(<SampleTable />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
