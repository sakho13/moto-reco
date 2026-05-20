import { type Locator, type Page } from '@playwright/test'

/**
 * ホームページの Page Object Model
 *
 * @remarks
 * /app/home に対応。主要セクションを data-testid で参照する。
 * - `[data-testid="touring-section"]`: TouringStartEndSection
 * - `[data-testid="fuel-section"]`: QuickFuelSection
 * - `[data-testid="history-section"]`: RecentHistorySection
 */
export class HomePage {
  readonly page: Page
  readonly touringSection: Locator
  readonly fuelSection: Locator
  readonly historySection: Locator

  constructor(page: Page) {
    this.page = page
    this.touringSection = page.locator('[data-testid="touring-section"]')
    this.fuelSection = page.locator('[data-testid="fuel-section"]')
    this.historySection = page.locator('[data-testid="history-section"]')
  }

  /** ホームページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/home')
  }
}
