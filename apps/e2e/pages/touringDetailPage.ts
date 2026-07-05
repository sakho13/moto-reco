import { type Locator, type Page } from '@playwright/test'

/**
 * ツーリング詳細ページの Page Object Model
 *
 * @remarks
 * /app/my-bike/{bikeId}/tourings/{touringId} に対応。
 * 給油履歴紐づけモーダル（TouringFuelLogLinkModal）の操作もあわせて提供する。
 */
export class TouringDetailPage {
  readonly page: Page
  readonly fuelLogLinkButton: Locator
  readonly periodOnlyToggle: Locator
  readonly linkButton: Locator
  readonly loadMoreButton: Locator

  constructor(page: Page) {
    this.page = page
    this.fuelLogLinkButton = page.getByRole('button', {
      name: '給油履歴の紐づけ',
    })
    this.periodOnlyToggle = page.getByRole('checkbox', {
      name: '期間内のみ表示',
    })
    this.linkButton = page.getByRole('button', { name: '紐づける' })
    this.loadMoreButton = page.getByRole('button', { name: 'もっと見る' })
  }

  /** ツーリング詳細ページへ遷移する */
  async goto(bikeId: string, touringId: string): Promise<void> {
    await this.page.goto(`/app/my-bike/${bikeId}/tourings/${touringId}`)
  }

  /** 給油履歴の紐づけモーダルを開く */
  async openFuelLogLinkModal(): Promise<void> {
    await this.fuelLogLinkButton.click()
  }

  /** 給油履歴ピッカー内のチェックボックスをラベル（部分一致可）で取得する */
  fuelLogCheckbox(labelPattern: string | RegExp): Locator {
    return this.page.getByRole('checkbox', { name: labelPattern })
  }

  /** 給油履歴の紐づけモーダルを送信して更新する */
  async submitFuelLogLink(): Promise<void> {
    await this.linkButton.click()
  }
}
