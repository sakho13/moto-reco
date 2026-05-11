import { expect, test as base, type Page } from '@playwright/test'
import { createTestUserAndGetToken } from '../helpers/authHelper'
import { createRandomEmail } from '../helpers/createRandomEmail'

const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000'
const TEST_PASSWORD = 'password123'

type AuthenticatedFixtures = {
  /** Firebase Emulator でテストユーザーを作成し、ログイン済みのページを返すフィクスチャ */
  authenticatedPage: Page
  /** テストユーザーのメールアドレス */
  testUserEmail: string
}

/**
 * 認証済みページフィクスチャ
 *
 * @remarks
 * Firebase Auth Emulator でテストユーザーを作成し、
 * アプリへのユーザー登録を行い、UIログインフローで認証済みページを返す。
 * テストごとに独立したユーザーを作成するため、テスト間の干渉がない。
 */
export const test = base.extend<AuthenticatedFixtures>({
  testUserEmail: async ({}, use) => {
    const email = createRandomEmail()
    await use(email)
  },

  authenticatedPage: async ({ page, testUserEmail }, use) => {
    // 1. Firebase Emulator でテストユーザーを作成し ID トークンを取得
    const token = await createTestUserAndGetToken(testUserEmail, TEST_PASSWORD)

    // 2. アプリにユーザーを登録
    const registerRes = await fetch(`${BASE_URL}/api/v1/user/auth/register`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: `E2Eテストユーザー` }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!registerRes.ok) {
      throw new Error(
        `ユーザー登録失敗: ${registerRes.status} ${await registerRes.text()}`
      )
    }

    // 3. UIログインフローで認証済みページを取得
    await page.goto('/app/login')
    await page.locator('#email').fill(testUserEmail)
    await page.locator('#password').fill(TEST_PASSWORD)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/app\/home/, { timeout: 15_000 })

    await use(page)
  },
})

export { expect }
