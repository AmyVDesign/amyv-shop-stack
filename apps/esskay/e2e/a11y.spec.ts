import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag22aa']

// color-contrast is included in wcag2aa, but name it explicitly so the intent
// is clear in test output and review diffs.
const ENABLED_RULES = { 'color-contrast': { enabled: true } }

type AxeViolation = {
  id: string
  impact?: string | null
  nodes: { target: (string | string[])[] }[]
}

function formatViolations(violations: AxeViolation[]): string {
  return violations
    .map(
      (v) =>
        `  [${v.impact ?? 'unknown'}] ${v.id}:\n` +
        v.nodes.map((n) => `    ${[n.target].flat().join(', ')}`).join('\n')
    )
    .join('\n')
}

// ── Public pages -- no auth required ────────────────────────────────────────

test.describe('Public pages', () => {
  test('home page has no serious axe violations', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const results = await new AxeBuilder({ page })
      .withTags(AXE_TAGS)
      .options({ rules: ENABLED_RULES })
      .analyze()

    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    )
    if (serious.length) {
      console.log('Axe violations on /:\n' + formatViolations(serious))
    }
    expect(serious, 'Serious/critical axe violations on home page').toHaveLength(0)
  })
})

// ── Authenticated admin pages ────────────────────────────────────────────────

/** Navigate to a protected route and return whether we're actually logged in. */
async function goToAdmin(page: Page, path: string): Promise<boolean> {
  await page.goto(path)
  return !page.url().includes('/login')
}

test.describe('Authenticated admin pages', () => {
  test('/admin/products has no serious axe violations', async ({ page }) => {
    const authed = await goToAdmin(page, '/admin/products')
    if (!authed) {
      test.skip(true, 'No admin credentials (E2E_EMAIL/E2E_PASSWORD not set) -- skipping')
    }
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(AXE_TAGS)
      .options({ rules: ENABLED_RULES })
      .analyze()

    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    )
    if (serious.length) {
      console.log('Axe violations on /admin/products:\n' + formatViolations(serious))
    }
    expect(serious, 'Serious/critical axe violations on /admin/products').toHaveLength(0)
  })

  test('product detail page has no serious axe violations', async ({ page }) => {
    const authed = await goToAdmin(page, '/admin/products')
    if (!authed) {
      test.skip(true, 'No admin credentials (E2E_EMAIL/E2E_PASSWORD not set) -- skipping')
    }
    await page.waitForLoadState('networkidle')

    // Product rows navigate via router.push on click, not via <a> tags
    const firstRow = page.locator('tbody tr').first()
    const rowCount = await firstRow.count()
    if (rowCount === 0) {
      test.skip(true, 'No products in the database -- skipping product detail test')
    }
    await firstRow.click()
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(AXE_TAGS)
      .options({ rules: ENABLED_RULES })
      .analyze()

    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    )
    if (serious.length) {
      console.log(`Axe violations on ${page.url()}:\n` + formatViolations(serious))
    }
    expect(serious, 'Serious/critical axe violations on product detail page').toHaveLength(0)
  })
})
