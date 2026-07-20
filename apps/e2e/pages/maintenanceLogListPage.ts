import { type Locator, type Page } from '@playwright/test'

/**
 * メンテナンス履歴一覧ページの Page Object Model
 *
 * @remarks
 * /app/my-bike/{bikeId}/maintenance-logs に対応（日付順ビュー）。
 */
export class MaintenanceLogListPage {
  readonly page: Page
  readonly searchSection: Locator
  readonly searchInput: Locator
  readonly searchButton: Locator
  readonly clearButton: Locator
  readonly noResultMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.searchSection = page.getByTestId('maintenance-log-search')
    this.searchInput = this.searchSection.getByRole('textbox', {
      name: 'メモで検索',
    })
    this.searchButton = this.searchSection.getByRole('button', {
      name: '検索',
    })
    this.clearButton = this.searchSection.getByRole('button', {
      name: 'クリア',
    })
    this.noResultMessage = page.getByText(
      '該当するメンテナンス履歴が見つかりませんでした'
    )
  }

  /** メンテナンス履歴一覧ページへ遷移する */
  async goto(bikeId: string): Promise<void> {
    await this.page.goto(`/app/my-bike/${bikeId}/maintenance-logs`)
  }

  /** キーワードを入力して検索を実行する */
  async searchByKeyword(keyword: string): Promise<void> {
    await this.searchInput.fill(keyword)
    await this.searchButton.click()
  }

  /** 検索条件をクリアする */
  async clearSearch(): Promise<void> {
    await this.clearButton.click()
  }

  /** メモ等（部分一致可）でメンテナンス履歴カードを取得する */
  maintenanceLogCard(pattern: string | RegExp): Locator {
    return this.page.getByRole('button', { name: pattern })
  }
}
