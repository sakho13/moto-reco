import { type Locator, type Page } from '@playwright/test'

/**
 * メンテナンス履歴一覧ページの Page Object Model
 *
 * @remarks
 * /app/my-bike/{bikeId}/maintenance-logs に対応（日付順ビュー）。
 *
 * Issue #575「05 画面案 ─ PC」により、PC幅（1024px以上）ではカードの縦1列
 * （`MaintenanceLogListSection`）ではなく台帳（`MaintenanceLedgerSection`）を
 * 表示する。Playwrightの既定ビューポート（Desktop Chrome, 1280x720）はPC幅に
 * 該当するため、このPOMは既定でPC版の台帳を対象にする。
 *
 * 注意: `display:none` の要素は Playwright の `getByRole` / `getByText` の
 * マッチ対象から自動的には除外されない。モバイル用のカード
 * （`MaintenanceLogItem`）とPC用の台帳の行（`MaintenanceLedgerList`）は同じ
 * 履歴に対して同じ文言（メモなど）を含みうるため、ロケーターは必ず
 * `maintenance-ledger-section` テストID配下に明示的にスコープしている
 * （`fuelLogListPage.ts` と同じ方針）。
 */
export class MaintenanceLogListPage {
  readonly page: Page
  readonly ledgerSection: Locator
  readonly searchSection: Locator
  readonly searchInput: Locator
  readonly searchButton: Locator
  readonly clearButton: Locator
  readonly noResultMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.ledgerSection = page.getByTestId('maintenance-ledger-section')
    this.searchSection = page.getByTestId('maintenance-ledger-search')
    this.searchInput = this.searchSection.getByRole('textbox', {
      name: 'メモで検索',
    })
    this.searchButton = this.searchSection.getByRole('button', {
      name: '検索',
    })
    this.clearButton = this.searchSection.getByRole('button', {
      name: 'クリア',
    })
    this.noResultMessage = this.ledgerSection.getByText(
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

  /**
   * メモ等（部分一致可）でメンテナンス履歴の行（PC版の台帳）を取得する
   *
   * @remarks
   * `display:none` のモバイル用カード（`MaintenanceLogItem`）も同じ文言を
   * 含みうるため、台帳（`maintenance-ledger-section`）配下に明示的に
   * スコープしている。
   */
  maintenanceLogCard(pattern: string | RegExp): Locator {
    return this.ledgerSection.getByRole('button', { name: pattern })
  }
}
