import { type Locator, type Page } from '@playwright/test'

/**
 * ツーリング詳細ページの Page Object Model
 *
 * @remarks
 * /app/my-bike/{bikeId}/tourings/{touringId} に対応。
 * 給油履歴紐づけモーダル（TouringFuelLogLinkModal）の操作もあわせて提供する。
 *
 * 閲覧モードと編集モードがある。地点の編集と並び替えは編集モードでだけ行える。
 * 地図は 1024px 未満では全画面パネルで開き、1024px 以上では右側に常時表示する。
 */
export class TouringDetailPage {
  readonly page: Page
  readonly fuelLogLinkButton: Locator
  readonly periodOnlyToggle: Locator
  readonly linkButton: Locator
  readonly loadMoreButton: Locator
  readonly editButton: Locator
  readonly finishEditButton: Locator
  readonly dragHandles: Locator
  readonly openMapButton: Locator
  readonly mapPanel: Locator
  readonly closeMapButton: Locator
  readonly mapPins: Locator

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
    this.editButton = page.getByRole('button', {
      name: '編集する',
      exact: true,
    })
    this.finishEditButton = page.getByRole('button', { name: '編集を終える' })
    this.dragHandles = page.getByRole('button', {
      name: 'ドラッグして並び替え',
    })
    this.openMapButton = page.getByRole('button', { name: '地図を開く' })
    this.mapPanel = page.getByRole('dialog', { name: 'ツーリングの地図' })
    this.closeMapButton = this.mapPanel.getByRole('button', {
      name: '道のりへ戻る',
    })
    this.mapPins = page.locator('.leaflet-marker-icon')
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
