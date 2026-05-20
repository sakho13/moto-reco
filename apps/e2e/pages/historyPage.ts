import { type Locator, type Page } from '@playwright/test'

/**
 * ヒストリーページの Page Object Model
 *
 * @remarks
 * /app/history に対応。
 * - BaseCard title="ヒストリー"
 * - 空状態: "ヒストリーはまだありません"
 * - HistoryItemCard のリスト
 */
export class HistoryPage {
  readonly page: Page
  readonly heading: Locator
  readonly emptyMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'ヒストリー' })
    this.emptyMessage = page.getByText('ヒストリーはまだありません')
  }

  /** ヒストリーページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/history')
  }
}
