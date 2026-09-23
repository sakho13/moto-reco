import { type Locator, type Page } from '@playwright/test'

/**
 * ヒストリーページの Page Object Model
 *
 * @remarks
 * /app/history に対応。
 * - 見出し "ヒストリー"
 * - 空状態: "ヒストリーはまだありません"
 * - 全バイク横断の記録一覧（`RecentRecordRow` の再利用。台帳の語彙）
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
