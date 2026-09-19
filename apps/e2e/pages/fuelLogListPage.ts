import { type Locator, type Page } from '@playwright/test'

/**
 * 給油履歴一覧ページの Page Object Model
 *
 * @remarks
 * /app/my-bike/{bikeId}/fuel-logs に対応。
 *
 * Issue #575「05 画面案 ─ PC」により、PC幅（1024px以上）ではカードの縦1列
 * （`FuelLogListSection`）ではなく台帳（`FuelLedgerSection`）を表示する。
 * Playwrightの既定ビューポート（Desktop Chrome, 1280x720）はPC幅に該当するため、
 * このPOMは既定でPC版の台帳を対象にする。
 *
 * 注意: `display:none` の要素は Playwright の `getByRole` / `getByText` の
 * マッチ対象から自動的には除外されない（実機検証で確認）。モバイル用のカード
 * （`FuelLogItem`）とPC用の台帳の行（`FuelLedgerList`）は同じ給油ログに対して
 * 同じ文言（走行距離・燃費など）を含みうるため、ロケーターは必ず
 * `fuel-ledger-section` テストID配下に明示的にスコープしている。
 */
export class FuelLogListPage {
  readonly page: Page
  readonly ledgerSection: Locator
  readonly searchSection: Locator
  readonly searchInput: Locator
  readonly searchButton: Locator
  readonly clearButton: Locator
  readonly noResultMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.ledgerSection = page.getByTestId('fuel-ledger-section')
    this.searchSection = page.getByTestId('fuel-ledger-search')
    this.searchInput = this.searchSection.getByRole('textbox', {
      name: 'メモ・ツーリング名で検索',
    })
    this.searchButton = this.searchSection.getByRole('button', {
      name: '検索',
    })
    this.clearButton = this.searchSection.getByRole('button', {
      name: 'クリア',
    })
    this.noResultMessage = this.ledgerSection.getByText(
      '該当する給油履歴が見つかりませんでした'
    )
  }

  /** 給油履歴一覧ページへ遷移する */
  async goto(bikeId: string): Promise<void> {
    await this.page.goto(`/app/my-bike/${bikeId}/fuel-logs`)
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
   * メモ・給油量等（部分一致可）で給油履歴の行（PC版の台帳）を取得する
   *
   * @remarks
   * `display:none` のモバイル用カード（`FuelLogItem`）も同じ文言を含みうるため
   * （`display:none` は `getByRole` の除外対象にならない）、
   * 台帳（`fuel-ledger-section`）配下に明示的にスコープしている。
   */
  fuelLogCard(pattern: string | RegExp): Locator {
    return this.ledgerSection.getByRole('button', { name: pattern })
  }
}
