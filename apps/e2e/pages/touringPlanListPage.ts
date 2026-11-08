import { type Locator, type Page } from '@playwright/test'

/**
 * ツーリングプラン一覧ページの Page Object Model
 *
 * @remarks
 * /app/my-bike/{bikeId}/touring-plans に対応。
 * モバイルとPCで同じ一覧（`TouringPlanList`）を表示する。
 */
export class TouringPlanListPage {
  readonly page: Page
  readonly listSection: Locator
  readonly noPlansMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.listSection = page.getByTestId('touring-plan-list-section')
    this.noPlansMessage = page.getByText(
      'ツーリングプランはまだ登録されていません'
    )
  }

  /** ツーリングプラン一覧ページへ遷移する */
  async goto(bikeId: string): Promise<void> {
    await this.page.goto(`/app/my-bike/${bikeId}/touring-plans`)
  }

  /** タイトル（部分一致可）でプランの行を取得する */
  planRow(titlePattern: string | RegExp): Locator {
    return this.listSection.getByRole('button', { name: titlePattern })
  }
}
