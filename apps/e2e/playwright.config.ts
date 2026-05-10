import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests',
  // DBステートが共有されるためテストは直列実行
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  // CIでは1ワーカー（DB競合防止）、ローカルはデフォルト
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // ローカルでは起動済みの pnpm dev を再利用し、CIでは pnpm dev を起動
    command: 'pnpm --filter @apps/web dev',
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_USE_FIREBASE_EMULATOR: 'true',
    },
  },
})
