import { type Locator, type Page } from '@playwright/test'

/**
 * ホームページの Page Object Model
 *
 * @remarks
 * /app/home に対応。主要セクションを data-testid で参照する（Issue #575 の
 * ホーム再構成後の構成）。
 * - `[data-testid="home-gauges"]`: HomeGauges（直近燃費・平均燃費・前回単価の計器）
 * - `[data-testid="home-actions"]`: HomeActions（給油を記録・ツーリングを開始）
 * - `[data-testid="history-section"]`: RecentHistorySection（最近の記録）
 *
 * ナビゲーション中央の「記録」ボタン（`RecordButton`）は、どの画面にも
 * 共通のヘッダー・下部ナビ配下にあるため `recordNavButton` として合わせて持つ。
 */
export class HomePage {
  readonly page: Page
  readonly gaugesSection: Locator
  readonly actionsSection: Locator
  readonly historySection: Locator
  readonly fuelButton: Locator
  readonly touringButton: Locator
  readonly recordNavButton: Locator

  constructor(page: Page) {
    this.page = page
    this.gaugesSection = page.locator('[data-testid="home-gauges"]')
    this.actionsSection = page.locator('[data-testid="home-actions"]')
    this.historySection = page.locator('[data-testid="history-section"]')
    this.fuelButton = page.getByRole('button', { name: '給油を記録' })
    this.touringButton = page.getByRole('button', {
      name: 'ツーリングを開始',
    })
    // exact: true でないと「給油を記録」ボタン（HomeActions）にも部分一致してしまう
    this.recordNavButton = page.getByRole('button', {
      name: '記録',
      exact: true,
    })
  }

  /** ホームページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/home')
  }
}
