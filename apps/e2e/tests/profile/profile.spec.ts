import { expect, test } from '../../fixtures/authenticatedPage'
import { AccountPage, ProfilePage } from '../../pages/profilePage'

/**
 * プロフィールページ E2E テスト
 */
test.describe('プロフィールページ', () => {
  test('プロフィールカードとオプションカードが表示される', async ({
    authenticatedPage,
  }) => {
    const profilePage = new ProfilePage(authenticatedPage)
    await profilePage.goto()

    await expect(profilePage.profileCardHeading).toBeVisible()
    await expect(profilePage.authInfoLink).toBeVisible()
    await expect(profilePage.planLink).toBeVisible()
  })

  test('認証情報ページにメールアドレスが表示される', async ({
    authenticatedPage,
    testUserEmail,
  }) => {
    const accountPage = new AccountPage(authenticatedPage)
    await accountPage.goto()

    await expect(accountPage.accountCardHeading).toBeVisible()
    await expect(accountPage.emailText(testUserEmail)).toBeVisible()
  })

  test('ログアウトボタンが表示される', async ({ authenticatedPage }) => {
    const profilePage = new ProfilePage(authenticatedPage)
    await profilePage.goto()

    await expect(profilePage.logoutButton).toBeVisible()
  })

  test('ログアウト後にログインページへリダイレクトされる', async ({
    authenticatedPage,
  }) => {
    const profilePage = new ProfilePage(authenticatedPage)
    await profilePage.goto()

    await profilePage.logout()

    await expect(authenticatedPage).toHaveURL(/\/app\/login/)
  })
})
