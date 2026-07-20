import { type Locator, type Page } from '@playwright/test'

/**
 * ツーリング一覧ページの Page Object Model
 *
 * @remarks
 * /app/my-bike/{bikeId}/tourings に対応。
 */
export class TouringListPage {
  readonly page: Page
  readonly searchSection: Locator
  readonly searchInput: Locator
  readonly searchButton: Locator
  readonly clearButton: Locator
  readonly noResultMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.searchSection = page.getByTestId('touring-search')
    this.searchInput = this.searchSection.getByRole('textbox', {
      name: 'タイトルで検索',
    })
    this.searchButton = this.searchSection.getByRole('button', {
      name: '検索',
    })
    this.clearButton = this.searchSection.getByRole('button', {
      name: 'クリア',
    })
    this.noResultMessage = page.getByText(
      '該当するツーリングが見つかりませんでした'
    )
  }

  /** ツーリング一覧ページへ遷移する */
  async goto(bikeId: string): Promise<void> {
    await this.page.goto(`/app/my-bike/${bikeId}/tourings`)
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

  /** タイトル（部分一致可）でツーリングカードを取得する */
  touringCard(titlePattern: string | RegExp): Locator {
    return this.page.getByRole('button', { name: titlePattern })
  }
}
