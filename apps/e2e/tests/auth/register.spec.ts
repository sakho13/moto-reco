import { expect, test } from '@playwright/test'
import { createRandomEmail } from '../../helpers/createRandomEmail'
import { ProfilePage } from '../../pages/profilePage'
import { RegisterPage } from '../../pages/registerPage'

/**
 * メールアドレスでの新規登録の E2E テスト
 *
 * @remarks
 * Firebase の email/password 認証はメール未確認でも登録できるため、
 * 登録時点では通知メールアドレスを確定させず、確認メールの送信待ちとして扱う。
 */
test.describe('メールアドレスでの新規登録', () => {
  test('登録直後は通知メールアドレスが確認待ちとして表示される', async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page)
    const email = createRandomEmail()

    await registerPage.goto()
    await registerPage.registerWithEmail({
      name: 'E2E新規登録ユーザー',
      email,
      password: 'password123',
    })
    await registerPage.waitForRedirectToHome()
    await expect(
      page.getByText('確認メールを送信しました').first()
    ).toBeVisible()

    const profilePage = new ProfilePage(page)
    await profilePage.goto()
    await expect(profilePage.pendingEmailNote).toContainText(email)
  })
})
