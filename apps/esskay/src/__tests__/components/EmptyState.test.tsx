// Contrast is verified in the Playwright e2e layer, not here,
// because jsdom does not compute CSS custom property styles.
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { EmptyState, Button } from '@amyv/ui'

describe('EmptyState accessibility', () => {
  it('message-only has no axe violations', async () => {
    const { container } = render(
      <EmptyState message="No parts found matching your search." />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('message with action has no axe violations', async () => {
    const { container } = render(
      <EmptyState
        message="No parts yet."
        action={<Button size="sm">Add Part</Button>}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
