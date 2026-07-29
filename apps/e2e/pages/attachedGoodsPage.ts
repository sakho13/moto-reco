import { type Locator, type Page } from '@playwright/test'

/**
 * マイバイク詳細「取り付けアクセサリ」ページの Page Object Model
 *
 * @remarks
 * /app/my-bike/{bikeId}/goods に対応。
 */
export class AttachedGoodsPage {
  readonly page: Page
  readonly section: Locator
  readonly registerButton: Locator
  readonly emptyMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.section = page.getByTestId('attached-goods-section')
    this.registerButton = this.section.getByRole('button', {
      name: 'グッズを追加',
    })
    this.emptyMessage = page.getByText(
      '取り付けアクセサリがまだ登録されていません'
    )
  }

  /** 取り付けアクセサリページへ遷移する */
  async goto(bikeId: string): Promise<void> {
    await this.page.goto(`/app/my-bike/${bikeId}/goods`)
  }

  /** メーカー名+商品名（部分一致可）でグッズカードを取得する */
  goodsCard(pattern: string | RegExp): Locator {
    return this.section.getByText(pattern)
  }
}
