import { expect, test } from '../../fixtures/authenticatedPage'
import { NotificationsPage } from '../../pages/notificationsPage'

/**
 * SP（スマートフォン）ビューでの通知ドロップダウン表示テスト
 *
 * @remarks
 * Issue #398: SP表示でお知らせポップアップが画面外に表示される
 */
test.describe('通知ドロップダウン SP表示', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('375px幅でドロップダウンが画面内に収まる', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/app/home')
    const notifPage = new NotificationsPage(authenticatedPage)

    await notifPage.openDropdown()
    await expect(notifPage.notificationDropdown).toBeVisible()

    const viewportWidth = authenticatedPage.viewportSize()?.width ?? 375
    const box = await notifPage.notificationDropdown.boundingBox()

    expect(box).not.toBeNull()
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth)
    }
  })

  test('320px幅でドロップダウンが画面内に収まる', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.setViewportSize({ width: 320, height: 568 })
    await authenticatedPage.goto('/app/home')
    const notifPage = new NotificationsPage(authenticatedPage)

    await notifPage.openDropdown()
    await expect(notifPage.notificationDropdown).toBeVisible()

    const box = await notifPage.notificationDropdown.boundingBox()

    expect(box).not.toBeNull()
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(320)
    }
  })
})
