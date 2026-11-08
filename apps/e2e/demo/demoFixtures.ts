import { expect, test as base, type Page } from '@playwright/test'
import { createTestUserAndGetToken } from '../helpers/authHelper'
import { createRandomEmail } from '../helpers/createRandomEmail'
import { BASE_URL } from '../helpers/env'

const DEMO_PASSWORD = 'password123'
const DEMO_USER_NAME = 'ゆうき'

type DemoFixtures = {
  /** 録画用ユーザーの Firebase ID トークン（データ作成用） */
  authToken: string
  /** 録画用ユーザーでログイン済みのページ */
  demoPage: Page
}

/**
 * 操作動画の録画用フィクスチャ
 *
 * @remarks
 * テスト用の `authenticatedPage` と同じ手順でユーザーを作るが、
 * 画面に映るユーザー名を LP 向けの名前にしている。
 */
export const test = base.extend<DemoFixtures & { demoEmail: string }>({
  demoEmail: async ({}, use) => {
    await use(createRandomEmail())
  },

  authToken: async ({ demoEmail }, use) => {
    await use(await createTestUserAndGetToken(demoEmail, DEMO_PASSWORD))
  },

  demoPage: async ({ page, demoEmail, authToken }, use) => {
    const res = await fetch(`${BASE_URL}/api/v1/user/auth/register`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: DEMO_USER_NAME }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      throw new Error(`ユーザー登録失敗: ${res.status} ${await res.text()}`)
    }

    await page.goto('/app/login')
    await page.locator('#email').fill(demoEmail)
    await page.locator('#password').fill(DEMO_PASSWORD)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/app\/home/, { timeout: 30_000 })

    await use(page)
  },
})

export { expect }
