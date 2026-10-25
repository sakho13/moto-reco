import { expect, test } from '@playwright/test'
import { createRandomEmail } from '../../helpers/createRandomEmail'
import { LoginPage } from '../../pages/loginPage'

/**
 * Googleログイン E2E テスト
 *
 * @remarks
 * Auth Emulator のダミー Google ログイン画面を popup として操作する。
 */
test.describe('Googleログイン', () => {
  test('feature=google-login 指定時、新規Googleアカウントで登録してホームへリダイレクトされる', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page)
    await loginPage.gotoWithGoogleLogin()

    await expect(loginPage.googleLoginButton).toBeEnabled()
    await expect(loginPage.googlePolicyNote).toBeVisible()

    await loginPage.loginWithGoogle(createRandomEmail(), 'E2E Googleユーザー')
    await loginPage.waitForRedirectToHome()

    await expect(page).toHaveURL(/\/app\/home/)
  })

  test('パラメータなしではGoogleログインボタンが無効化されている', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await expect(loginPage.googleLoginButton).toBeDisabled()
    await expect(loginPage.googlePolicyNote).toBeHidden()
  })
})
