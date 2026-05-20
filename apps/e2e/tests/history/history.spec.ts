import { expect, test } from '../../fixtures/authenticatedPage'
import { HistoryPage } from '../../pages/historyPage'

/**
 * ヒストリーページ E2E テスト
 */
test.describe('ヒストリーページ', () => {
  test('ヒストリーページが正常に表示される', async ({ authenticatedPage }) => {
    const historyPage = new HistoryPage(authenticatedPage)
    await historyPage.goto()

    await expect(historyPage.heading).toBeVisible()
  })

  test('バイク未登録の状態では空状態メッセージが表示される', async ({
    authenticatedPage,
  }) => {
    const historyPage = new HistoryPage(authenticatedPage)
    await historyPage.goto()

    await expect(historyPage.emptyMessage).toBeVisible()
  })
})
