import { expect, test } from '@playwright/test'
import { createRandomEmail } from '../../helpers/createRandomEmail'
import { LoginPage } from '../../pages/loginPage'
import { RegisterPage } from '../../pages/registerPage'

/**
 * Googleログイン E2E テスト
 *
 * @remarks
 * Auth Emulator のダミー Google ログイン画面を popup として操作する。
 */
test.describe('Googleログイン', () => {
  test('ログイン画面から新規Googleアカウントで登録してホームへリダイレクトされる', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await expect(loginPage.googleLoginButton).toBeEnabled()
    await expect(loginPage.googlePolicyNote).toBeVisible()

    await loginPage.loginWithGoogle(createRandomEmail(), 'E2E Googleユーザー')
    await loginPage.waitForRedirectToHome()

    await expect(page).toHaveURL(/\/app\/home/)
  })

  test('登録画面から新規Googleアカウントで登録してホームへリダイレクトされる', async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page)
    await registerPage.goto()

    await expect(registerPage.googleRegisterButton).toBeEnabled()
    await expect(registerPage.googlePolicyNote).toBeVisible()

    await registerPage.registerWithGoogle(
      createRandomEmail(),
      'E2E Googleユーザー'
    )
    await registerPage.waitForRedirectToHome()

    await expect(page).toHaveURL(/\/app\/home/)
  })
})
