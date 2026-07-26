import { type Locator, type Page } from '@playwright/test'

/**
 * グッズ一覧ページの Page Object Model
 *
 * @remarks
 * /app/goods に対応。
 */
export class GoodsPage {
  readonly page: Page
  readonly section: Locator
  readonly registerButton: Locator
  readonly emptyMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.section = page.getByTestId('goods-section')
    this.registerButton = this.section.getByRole('button', {
      name: 'グッズを追加',
    })
    this.emptyMessage = page.getByText('グッズがまだ登録されていません')
  }

  /** グッズ一覧ページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/goods')
  }

  /** メーカー名+商品名（部分一致可）でグッズカードを取得する */
  goodsCard(pattern: string | RegExp): Locator {
    return this.section.getByText(pattern)
  }
}
