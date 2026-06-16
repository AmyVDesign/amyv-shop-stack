import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },

  projects: [
    // Auth setup runs first and saves storageState
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // All tests run with the saved auth state (may be empty if no creds)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'pnpm dev',
    port: 3001,
    // Reuse a running server locally; always start fresh in CI
    reuseExistingServer: !process.env.CI,
    // First Next.js boot can be slow
    timeout: 120_000,
  },
})
