import { expect, test } from '@playwright/test'
import { createTestUserAndGetToken } from '../../helpers/authHelper'
import { createRandomEmail } from '../../helpers/createRandomEmail'
import { BASE_URL } from '../../helpers/env'
import { HomePage } from '../../pages/homePage'
import { LoginPage } from '../../pages/loginPage'

const TEST_PASSWORD = 'password123'

/**
 * ログインフロー E2E テスト
 */
test.describe('ログインフロー', () => {
  let testEmail: string

  test.beforeEach(async () => {
    testEmail = createRandomEmail()
    const token = await createTestUserAndGetToken(testEmail, TEST_PASSWORD)

    // アプリにユーザーを登録
    const res = await fetch(`${BASE_URL}/api/v1/user/auth/register`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'E2Eテストユーザー' }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      throw new Error(`ユーザー登録失敗: ${res.status}`)
    }
  })

  test('有効な認証情報でログインし、ホームへリダイレクトされる', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(testEmail, TEST_PASSWORD)
    await loginPage.waitForRedirectToHome()

    await expect(page).toHaveURL(/\/app\/home/)
  })

  test('ログイン後にホームページのセクションが表示される', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(testEmail, TEST_PASSWORD)
    await loginPage.waitForRedirectToHome()

    const homePage = new HomePage(page)
    await expect(homePage.touringSection).toBeVisible()
    await expect(homePage.fuelSection).toBeVisible()
    await expect(homePage.historySection).toBeVisible()
  })

  test('無効なパスワードでログインエラーが表示される', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(testEmail, 'wrongpassword')

    await expect(loginPage.errorMessage).toBeVisible()
    await expect(page).toHaveURL(/\/app\/login/)
  })
})
