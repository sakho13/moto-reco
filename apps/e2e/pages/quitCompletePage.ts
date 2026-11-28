import { type Locator, type Page } from '@playwright/test'

/**
 * 退会手続き完了ページの Page Object Model
 *
 * @remarks
 * /app/quit-complete（QuitCompleteCard.tsx）に対応。
 * 復帰用URLは案内メールでのみ届けるため、画面には案内文だけを表示する。
 */
export class QuitCompletePage {
  readonly page: Page
  readonly heading: Locator
  readonly recoveryGuide: Locator
  readonly copyButton: Locator
  readonly loginLink: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: '退会手続き完了' })
    this.recoveryGuide = page.getByText(
      '30日間は案内メール内のリンクから復帰できます'
    )
    this.copyButton = page.getByRole('button', {
      name: 'クリップボードにコピー',
    })
    this.loginLink = page.getByRole('link', { name: 'ログイン画面へ' })
  }
}
