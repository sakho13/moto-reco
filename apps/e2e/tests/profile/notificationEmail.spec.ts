import { expect, test } from '../../fixtures/authenticatedPage'
import { createRandomEmail } from '../../helpers/createRandomEmail'
import { ProfilePage } from '../../pages/profilePage'

/**
 * 通知メールアドレス変更（所有確認）の E2E テスト
 */
test.describe('通知メールアドレスの変更', () => {
  test('新しいアドレスは即時反映されず、確認待ちとして表示される', async ({
    authenticatedPage,
    testUserEmail,
  }) => {
    const profilePage = new ProfilePage(authenticatedPage)
    await profilePage.goto()
    const newEmail = createRandomEmail()

    await profilePage.editProfile({ notificationEmail: newEmail })

    await expect(profilePage.pendingEmailNote).toContainText(newEmail)
    // 確定済みの通知メールアドレスは登録時のまま
    await expect(
      authenticatedPage.getByText(testUserEmail).first()
    ).toBeVisible()
  })

  test('確認待ちの間に名前だけを保存しても、確認待ちは取り消されない', async ({
    authenticatedPage,
  }) => {
    const profilePage = new ProfilePage(authenticatedPage)
    await profilePage.goto()
    const newEmail = createRandomEmail()
    await profilePage.editProfile({ notificationEmail: newEmail })
    await expect(profilePage.pendingEmailNote).toContainText(newEmail)

    await profilePage.editButton.click()
    await expect(profilePage.notificationEmailInput).toHaveValue(newEmail)
    await profilePage.nameInput.fill('名前だけ変更したユーザー')
    await profilePage.saveButton.click()
    await profilePage.editModal.waitFor({ state: 'hidden', timeout: 15_000 })

    await expect(
      authenticatedPage.getByText('名前だけ変更したユーザー')
    ).toBeVisible()
    await expect(profilePage.pendingEmailNote).toContainText(newEmail)

    await authenticatedPage.reload()
    await expect(profilePage.pendingEmailNote).toContainText(newEmail)
  })

  test('確認待ちの間に元のアドレスへ戻して保存すると、確認待ちを取り消せる', async ({
    authenticatedPage,
    testUserEmail,
  }) => {
    const profilePage = new ProfilePage(authenticatedPage)
    await profilePage.goto()
    await profilePage.editProfile({ notificationEmail: createRandomEmail() })
    await expect(profilePage.pendingEmailNote).toBeVisible()

    await profilePage.editProfile({ notificationEmail: testUserEmail })

    await expect(profilePage.pendingEmailNote).toHaveCount(0)
  })
})
