import { type Locator, type Page } from '@playwright/test'

/**
 * マイバイク一覧ページの Page Object Model
 *
 * @remarks
 * /app/my-bike に対応。
 * - `button[text="バイクを登録"]`: ページ上部の登録ボタン
 * - `button[text="グッズ一覧"]`: ページ上部のグッズ一覧への導線ボタン
 * - MyBikeListSection の空状態メッセージ
 * - NavigationCard として表示されるバイクカード
 */
export class MyBikePage {
  readonly page: Page
  readonly registerButton: Locator
  readonly goodsListButton: Locator
  readonly emptyMessage: Locator
  readonly emptyRegisterButton: Locator

  constructor(page: Page) {
    this.page = page
    this.registerButton = page.getByRole('button', { name: 'バイクを登録' })
    this.goodsListButton = page.getByRole('button', { name: 'グッズ一覧' })
    this.emptyMessage = page.getByText('まだバイクが登録されていません')
    this.emptyRegisterButton = page.getByRole('button', {
      name: '最初のバイクを登録',
    })
  }

  /** マイバイクページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/my-bike')
  }

  /** ニックネームまたはモデル名でバイクカードを取得する */
  bikeCard(name: string): Locator {
    return this.page.getByRole('link', { name: new RegExp(name) })
  }
}
