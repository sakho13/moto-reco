import { expect, test } from '../../fixtures/authenticatedPage'
import { AccountPage } from '../../pages/profilePage'
import { QuitCompletePage } from '../../pages/quitCompletePage'

/**
 * 退会の E2E テスト
 *
 * @remarks
 * 復帰用トークンは無認証でアカウントを復帰できるため、画面・URL には出さず案内メールでのみ届ける。
 */
test.describe('退会', () => {
  test('確認ステップで復帰手段の注意を表示し、同意するまで退会できない', async ({
    authenticatedPage,
    testUserEmail,
  }) => {
    const accountPage = new AccountPage(authenticatedPage)
    await accountPage.goto()
    await accountPage.openQuitConfirm('E2Eテストのための退会')

    await expect(accountPage.quitRecoveryNotice).toBeVisible()
    await expect(accountPage.quitRecoveryNotice).toContainText(testUserEmail)
    await expect(accountPage.quitConfirmButton).toBeDisabled()

    await accountPage.quitAcknowledgeCheckbox.check()
    await expect(accountPage.quitConfirmButton).toBeEnabled()
  })

  test('退会完了画面に復帰用URLを表示せず、URLにもトークンを含めない', async ({
    authenticatedPage,
  }) => {
    const accountPage = new AccountPage(authenticatedPage)
    await accountPage.goto()
    await expect(accountPage.quitCardHeading).toBeVisible()

    await accountPage.openQuitConfirm('E2Eテストのための退会')
    await accountPage.confirmQuit()

    const quitCompletePage = new QuitCompletePage(authenticatedPage)
    await expect(quitCompletePage.heading).toBeVisible()
    await expect(quitCompletePage.recoveryGuide).toBeVisible()
    await expect(quitCompletePage.copyButton).toHaveCount(0)
    await expect(authenticatedPage.getByText('/app/recover')).toHaveCount(0)
    expect(new URL(authenticatedPage.url()).search).toBe('')
  })
})
