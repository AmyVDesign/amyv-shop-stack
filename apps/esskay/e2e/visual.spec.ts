// Visual regression tests
//
// Baselines are environment-pinned PNG files committed alongside the spec.
// Generate or update locally:
//   pnpm test:visual -- --update-snapshots
//
// These tests are NOT in the automated CI pipeline -- screenshot comparison
// is sensitive to OS and GPU rendering differences across machines.
// A containerized run (Docker + Linux Chromium) can be added later when a
// stable baseline environment is established.

import { test, expect, type Page } from '@playwright/test'

/**
 * Navigate to a protected route.
 * Uses waitUntil:'commit' so we detect the middleware redirect to /login
 * immediately, without hanging on the 'load' event of a page that may
 * abort via Next.js App Router client-side navigation.
 * Returns true (authed) or false (redirected to login).
 */
async function goToAdmin(page: Page, path: string): Promise<boolean> {
  await page.goto(path, { waitUntil: 'commit' })
  if (page.url().includes('/login')) return false
  await page.waitForLoadState('networkidle')
  return true
}

// ── Public page ──────────────────────────────────────────────────────────────

test.describe('Visual regression -- public pages', () => {
  test('home page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('home.png', { fullPage: true })
  })
})

// ── Design-system page (authenticated) ──────────────────────────────────────
//
// The design-system page renders the full component library and token system.
// One baseline here guards the appearance of every component and color token.
// A second baseline after the theme toggle guards the alternate palette.

test.describe('Visual regression -- design system', () => {
  test('default theme', async ({ page }) => {
    const authed = await goToAdmin(page, '/admin/design-system')
    if (!authed) {
      test.skip(true, 'No admin credentials (E2E_EMAIL/E2E_PASSWORD not set) -- skipping')
    }
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('design-system-default.png', { fullPage: true })
  })

  test('Galaxy SF theme after toggle', async ({ page }) => {
    const authed = await goToAdmin(page, '/admin/design-system')
    if (!authed) {
      test.skip(true, 'No admin credentials (E2E_EMAIL/E2E_PASSWORD not set) -- skipping')
    }
    await page.waitForLoadState('networkidle')

    // Scroll to the theme-swap section and click the toggle
    await page.locator('#theme-swap').scrollIntoViewIfNeeded()
    const toggle = page.getByRole('button', { name: /Switch to Galaxy SF/i })
    await toggle.click()
    // Wait for THIS toggle to reflect its pressed state -- scoped to the same
    // locator so any other aria-pressed button on the page does not satisfy it
    await toggle.and(page.locator('[aria-pressed="true"]')).waitFor({ timeout: 4_000 })

    await expect(page).toHaveScreenshot('design-system-galaxy.png', { fullPage: true })
  })
})
