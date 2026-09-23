import { type Locator, type Page } from '@playwright/test'

/**
 * ツーリング一覧ページの Page Object Model
 *
 * @remarks
 * /app/my-bike/{bikeId}/tourings に対応。
 *
 * Issue #575「05 画面案 ─ PC」により、PC幅（1024px以上）ではカードの縦1列
 * （`TouringListSection`）ではなく台帳（`TouringLedgerSection`）を表示する。
 * Playwrightの既定ビューポート（Desktop Chrome, 1280x720）はPC幅に該当するため、
 * このPOMは既定でPC版の台帳を対象にする。
 *
 * 注意: `display:none` の要素は Playwright の `getByRole` / `getByText` の
 * マッチ対象から自動的には除外されない。モバイル用のカード
 * （`TouringListItem`）とPC用の台帳の行（`TouringLedgerList`）は同じ
 * ツーリングに対して同じ文言（タイトルなど）を含みうるため、ロケーターは
 * 必ず `touring-ledger-section` テストID配下に明示的にスコープしている
 * （`fuelLogListPage.ts` と同じ方針）。
 */
export class TouringListPage {
  readonly page: Page
  readonly ledgerSection: Locator
  readonly searchSection: Locator
  readonly searchInput: Locator
  readonly searchButton: Locator
  readonly clearButton: Locator
  readonly noResultMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.ledgerSection = page.getByTestId('touring-ledger-section')
    this.searchSection = page.getByTestId('touring-ledger-search')
    this.searchInput = this.searchSection.getByRole('textbox', {
      name: 'タイトルで検索',
    })
    this.searchButton = this.searchSection.getByRole('button', {
      name: '検索',
    })
    this.clearButton = this.searchSection.getByRole('button', {
      name: 'クリア',
    })
    this.noResultMessage = this.ledgerSection.getByText(
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

  /**
   * タイトル（部分一致可）でツーリングの行（PC版の台帳）を取得する
   *
   * @remarks
   * `display:none` のモバイル用カード（`TouringListItem`）も同じ文言を含み
   * うるため、台帳（`touring-ledger-section`）配下に明示的にスコープしている。
   */
  touringCard(titlePattern: string | RegExp): Locator {
    return this.ledgerSection.getByRole('button', { name: titlePattern })
  }
}
