import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from '@playwright/test'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000'

/**
 * LP に載せる操作動画を録画する設定
 *
 * @remarks
 * `pnpm demo:record` で実行する。テスト用の `playwright.config.ts` とは
 * testDir を分けているため、通常のテストや CI では動かない。
 * 録画した動画は `apps/web/public/videos/lp/` に書き出す。
 */
export default defineConfig({
  testDir: './demo',
  testMatch: '*.demo.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    colorScheme: 'light',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: 'pnpm dev',
    cwd: path.resolve(__dirname, '../web'),
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_USE_FIREBASE_EMULATOR: 'true',
    },
  },
})
