import { type Locator, type Page } from '@playwright/test'

/**
 * アプリ紹介ページの Page Object Model
 *
 * @remarks
 * /about に対応。
 * - ヘッダーのテーマ切り替えボタン（aria-label は現在のモードに応じて切り替わる）
 * - 現在のテーマモードは `<html data-theme-mode>` に反映される
 */
export class AboutPage {
  readonly page: Page
  readonly themeToggleButton: Locator

  constructor(page: Page) {
    this.page = page
    this.themeToggleButton = page.getByRole('button', {
      name: /^テーマを(ライト|ダーク)モードに切り替える$/,
    })
  }

  /** アプリ紹介ページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/about')
  }
}
