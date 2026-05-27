import { expect, test } from '../../fixtures/authenticatedPage'
import { NotificationsPage } from '../../pages/notificationsPage'

/**
 * 通知機能 E2E テスト
 */
test.describe('通知ベルボタン', () => {
  test('ホーム画面の右上にベルボタンが表示される', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/app/home')
    const notifPage = new NotificationsPage(authenticatedPage)

    await expect(notifPage.bellButton).toBeVisible()
  })

  test('ベルボタンをクリックするとドロップダウンが開く', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/app/home')
    const notifPage = new NotificationsPage(authenticatedPage)

    await notifPage.openDropdown()

    await expect(notifPage.notificationDropdown).toBeVisible()
    await expect(notifPage.dropdownMarkAllReadButton).toBeVisible()
    await expect(notifPage.dropdownViewAllButton).toBeVisible()
  })

  test('通知がない場合ドロップダウンに「通知はありません」と表示される', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/app/home')
    const notifPage = new NotificationsPage(authenticatedPage)

    await notifPage.openDropdown()

    await expect(notifPage.emptyMessage).toBeVisible()
  })

  test('「すべての通知を見る」ボタンで通知ページへ遷移する', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/app/home')
    const notifPage = new NotificationsPage(authenticatedPage)

    await notifPage.openDropdown()
    await notifPage.viewAll()

    await expect(authenticatedPage).toHaveURL(/\/app\/notifications/)
  })
})

test.describe('通知一覧ページ', () => {
  test('通知ページが正常に表示される', async ({ authenticatedPage }) => {
    const notifPage = new NotificationsPage(authenticatedPage)
    await notifPage.goto()

    await expect(notifPage.pageHeading).toBeVisible()
  })

  test('通知がない場合「通知はありません」と表示される', async ({
    authenticatedPage,
  }) => {
    const notifPage = new NotificationsPage(authenticatedPage)
    await notifPage.goto()

    await expect(notifPage.emptyMessage).toBeVisible()
  })

  test('通知ページにもベルボタンが右上に表示される', async ({
    authenticatedPage,
  }) => {
    const notifPage = new NotificationsPage(authenticatedPage)
    await notifPage.goto()

    await expect(notifPage.bellButton).toBeVisible()
  })
})
