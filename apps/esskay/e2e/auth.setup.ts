import { test as setup } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const authFile = path.join(__dirname, '.auth/admin.json')

setup('authenticate admin', async ({ page }) => {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD

  if (!email || !password) {
    console.log(
      '\n[playwright] E2E_EMAIL / E2E_PASSWORD not set -- ' +
      'skipping admin auth. Authenticated tests will be skipped.\n'
    )
    fs.mkdirSync(path.dirname(authFile), { recursive: true })
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }))
    return
  }

  await page.goto('/admin/login')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  // After login, the app redirects away from /admin/login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 })
  await page.context().storageState({ path: authFile })
})
