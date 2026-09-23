import { type Locator, type Page } from '@playwright/test'

/**
 * ツーリングプラン一覧ページの Page Object Model
 *
 * @remarks
 * /app/my-bike/{bikeId}/touring-plans に対応。
 *
 * Issue #575「05 画面案 ─ PC」により、PC幅（1024px以上）ではカードの縦1列
 * （`PlanCard`）ではなく台帳（`TouringPlanLedgerList`）を表示する。
 * Playwrightの既定ビューポート（Desktop Chrome, 1280x720）はPC幅に該当するため、
 * このPOMは既定でPC版の台帳を対象にする。
 *
 * 注意: `display:none` の要素は Playwright の `getByText` のマッチ対象から
 * 自動的には除外されない。モバイル用のカード（`PlanCard`）とPC用の台帳の行
 * （`TouringPlanLedgerList`）は同じプランに対して同じ文言（タイトルなど）を
 * 含みうるため、ロケーターは必ず `touring-plan-ledger-section` テストID配下に
 * 明示的にスコープしている（`fuelLogListPage.ts` と同じ方針）。
 * 一方、0件時の案内文は台帳・カードのどちらとも独立して1箇所にしか出さない
 * 構成のため、スコープなしで問題ない。
 */
export class TouringPlanListPage {
  readonly page: Page
  readonly ledgerSection: Locator
  readonly noPlansMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.ledgerSection = page.getByTestId('touring-plan-ledger-section')
    this.noPlansMessage = page.getByText(
      'ツーリングプランはまだ登録されていません'
    )
  }

  /** ツーリングプラン一覧ページへ遷移する */
  async goto(bikeId: string): Promise<void> {
    await this.page.goto(`/app/my-bike/${bikeId}/touring-plans`)
  }

  /**
   * タイトル（部分一致可）でプランの行（PC版の台帳）を取得する
   *
   * @remarks
   * `display:none` のモバイル用カード（`PlanCard`）も同じ文言を含みうるため、
   * 台帳（`touring-plan-ledger-section`）配下に明示的にスコープしている。
   */
  planRow(titlePattern: string | RegExp): Locator {
    return this.ledgerSection.getByText(titlePattern)
  }
}
