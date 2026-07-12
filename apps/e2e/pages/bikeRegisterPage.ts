import { type Locator, type Page } from '@playwright/test'

/**
 * バイク登録ページの Page Object Model
 *
 * @remarks
 * /app/bike/register に対応。3ステップウィザード形式。
 * - Step1: メーカー選択（現在無効）→「次へ」
 * - Step2: バイク検索（現在無効）→「次へ」
 * - Step3: 登録情報入力 → `#displacement`, `#totalMileage` を入力して「登録する」
 */
export class BikeRegisterPage {
  readonly page: Page
  readonly heading: Locator
  readonly nextButton: Locator
  readonly displacementInput: Locator
  readonly totalMileageInput: Locator
  readonly nicknameInput: Locator
  readonly submitButton: Locator
  readonly backButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'バイク登録' })
    this.nextButton = page.getByRole('button', { name: '次へ' })
    this.displacementInput = page.locator('#displacement')
    this.totalMileageInput = page.locator('#totalMileage')
    this.nicknameInput = page.locator('#nickname')
    this.submitButton = page.getByRole('button', { name: '登録する' })
    this.backButton = page.getByRole('button', { name: /← 戻る/ })
  }

  /** バイク登録ページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/bike/register')
  }

  /** ステップ1・2をスキップしてステップ3（入力フォーム）まで進む */
  async advanceToStep3(): Promise<void> {
    await this.nextButton.click()
    await this.nextButton.click()
  }

  /**
   * ステップ3でバイク情報を入力して送信する
   *
   * @param displacement - 排気量 (cc)
   * @param totalMileage - 現在の走行距離 (km)
   * @param nickname - ニックネーム（任意）
   */
  async fillAndSubmit(
    displacement: number,
    totalMileage: number,
    nickname?: string
  ): Promise<void> {
    await this.displacementInput.fill(String(displacement))
    await this.totalMileageInput.fill(String(totalMileage))
    if (nickname) {
      await this.nicknameInput.fill(nickname)
    }
    await this.submitButton.click()
  }
}
