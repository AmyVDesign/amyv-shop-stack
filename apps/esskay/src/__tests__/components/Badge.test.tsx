// Contrast is verified in the Playwright e2e layer, not here,
// because jsdom does not compute CSS custom property styles.
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { Badge } from '@amyv/ui'

const VARIANTS = ['green', 'gray', 'blue', 'orange'] as const

describe('Badge accessibility', () => {
  it.each(VARIANTS)('variant=%s has no axe violations', async (variant) => {
    const { container } = render(<Badge variant={variant}>{variant}</Badge>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
