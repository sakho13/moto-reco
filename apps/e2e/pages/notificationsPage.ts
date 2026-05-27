import { type Locator, type Page } from '@playwright/test'

/**
 * 通知ページの Page Object Model
 *
 * @remarks
 * /app/notifications に対応。
 * - ベルボタン（デスクトップ右上）
 * - 通知ドロップダウン
 * - 通知一覧ページ
 */
export class NotificationsPage {
  readonly page: Page
  readonly bellButton: Locator
  readonly notificationDropdown: Locator
  readonly dropdownViewAllButton: Locator
  readonly dropdownMarkAllReadButton: Locator
  readonly pageHeading: Locator
  readonly emptyMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.bellButton = page.getByRole('button', { name: /通知/ }).first()
    this.notificationDropdown = page.getByRole('dialog', { name: '通知' })
    this.dropdownViewAllButton = page.getByRole('button', {
      name: 'すべての通知を見る',
    })
    this.dropdownMarkAllReadButton = page.getByRole('button', {
      name: '全既読',
    })
    this.pageHeading = page.getByRole('heading', { name: '通知', level: 1 })
    this.emptyMessage = page.getByText('通知はありません')
  }

  /** 通知ページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/notifications')
  }

  /** ベルボタンをクリックしてドロップダウンを開く */
  async openDropdown(): Promise<void> {
    await this.bellButton.click()
    await this.notificationDropdown.waitFor({
      state: 'visible',
      timeout: 5_000,
    })
  }

  /** 「すべての通知を見る」をクリックして通知ページへ遷移する */
  async viewAll(): Promise<void> {
    await this.dropdownViewAllButton.click()
    await this.page.waitForURL(/\/app\/notifications/, { timeout: 10_000 })
  }
}
