import { expect, test } from '../../fixtures/authenticatedPage'
import { createRandomEmail } from '../../helpers/createRandomEmail'
import { LoginPage } from '../../pages/loginPage'
import { AccountPage, ProfilePage } from '../../pages/profilePage'

const NEW_PASSWORD = 'switchPass123'

/**
 * 認証方式の切り替え E2E テスト
 *
 * @remarks
 * Auth Emulator のダミー Google ログイン画面を popup として操作する。
 */
test.describe('認証方式の切り替え', () => {
  test('メール/パスワードからGoogleへ切り替えられる', async ({
    authenticatedPage,
    testUserEmail,
  }) => {
    const accountPage = new AccountPage(authenticatedPage)
    await accountPage.goto()

    await expect(accountPage.providerRow).toContainText('メール/パスワード')
    await expect(accountPage.switchToEmailButton).toBeHidden()

    await accountPage.switchToGoogle(testUserEmail, 'E2E Googleユーザー')

    await expect(
      authenticatedPage.getByText('ログイン方法をGoogleに切り替えました')
    ).toBeVisible({ timeout: 15_000 })
    await expect(accountPage.providerRow).toContainText('Google')
    await expect(accountPage.providerRow).not.toContainText('メール/パスワード')
    await expect(accountPage.switchToEmailButton).toBeVisible()
  })

  test('Googleからメール/パスワードへ切り替え、新しいパスワードでログインできる', async ({
    page,
  }) => {
    const email = createRandomEmail()
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginWithGoogle(email, 'E2E Googleユーザー')
    await loginPage.waitForRedirectToHome()

    const accountPage = new AccountPage(page)
    await accountPage.goto()
    await expect(accountPage.providerRow).toContainText('Google')

    await accountPage.switchToEmail(NEW_PASSWORD)

    await expect(
      page.getByText('ログイン方法をメール/パスワードに切り替えました')
    ).toBeVisible({ timeout: 15_000 })
    await expect(accountPage.providerRow).toContainText('メール/パスワード')
    await expect(accountPage.providerRow).not.toContainText('Google')

    const profilePage = new ProfilePage(page)
    await profilePage.goto()
    await profilePage.logout()

    await loginPage.login(email, NEW_PASSWORD)
    await loginPage.waitForRedirectToHome()
  })
})
