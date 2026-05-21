import { expect, test } from '../../fixtures/authenticatedPage'
import { ProfilePage } from '../../pages/profilePage'

/**
 * プロフィールページ E2E テスト
 */
test.describe('プロフィールページ', () => {
  test('プロフィールカードとアカウント認証カードが表示される', async ({
    authenticatedPage,
  }) => {
    const profilePage = new ProfilePage(authenticatedPage)
    await profilePage.goto()

    await expect(profilePage.profileCardHeading).toBeVisible()
    await expect(profilePage.accountCardHeading).toBeVisible()
  })

  test('アカウント認証カードにメールアドレスが表示される', async ({
    authenticatedPage,
    testUserEmail,
  }) => {
    const profilePage = new ProfilePage(authenticatedPage)
    await profilePage.goto()

    await expect(profilePage.emailText(testUserEmail)).toBeVisible()
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
