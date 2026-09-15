import { type Locator, type Page } from '@playwright/test'

/**
 * 給油シート（登録用）の Page Object Model
 *
 * @remarks
 * `FuelLogRegisterModal` 内の `FuelLogRegisterSheet`（#575 P1）に対応。
 * `/app/my-bike/{bikeId}/fuel-logs` の「給油を記録」ボタンから開く。
 * 入力はODO・給油量・支払金額の3項目のみで、それ以外（満タン/継ぎ足し・日時・
 * メモ）は既定値のまま送信できる。
 */
export class FuelLogRegisterSheetPage {
  readonly page: Page
  readonly sheet: Locator
  readonly mileageInput: Locator
  readonly amountInput: Locator
  readonly totalPriceInput: Locator
  readonly fullTankChip: Locator
  readonly continuationChip: Locator
  readonly liveGauge: Locator
  readonly submitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.sheet = page.getByTestId('fuel-log-register-sheet')
    this.mileageInput = page.getByRole('textbox', { name: '走行距離 ODO' })
    this.amountInput = page.getByRole('textbox', { name: '給油量' })
    this.totalPriceInput = page.getByRole('textbox', { name: '支払金額' })
    this.fullTankChip = page.getByRole('button', {
      name: '満タン',
      exact: true,
    })
    this.continuationChip = page.getByRole('button', {
      name: '継ぎ足し',
      exact: true,
    })
    this.liveGauge = page.getByTestId('fuel-log-live-gauge')
    this.submitButton = page.getByRole('button', { name: '記録する' })
  }

  /** バイクの給油履歴ページから、給油登録シートを開く */
  async goto(bikeId: string): Promise<void> {
    await this.page.goto(`/app/my-bike/${bikeId}/fuel-logs`)
    await this.page.getByRole('button', { name: '給油を記録' }).click()
    await this.sheet.waitFor({ state: 'visible' })
  }

  /**
   * ODO・給油量・支払金額の3項目を入力する
   *
   * @remarks
   * PC幅（>640px）は専用テンキーを表示しない通常の数値入力のため、
   * `fill()` でそのまま入力できる。
   */
  async fillMainFields(values: {
    mileage: number
    amount: number
    totalPrice: number
  }): Promise<void> {
    await this.mileageInput.fill(String(values.mileage))
    await this.amountInput.fill(String(values.amount))
    await this.totalPriceInput.fill(String(values.totalPrice))
  }

  /** 継ぎ足し給油に切り替える（既定は満タン） */
  async selectContinuation(): Promise<void> {
    await this.continuationChip.click()
  }

  /** 「記録する」ボタンを押して送信する */
  async submit(): Promise<void> {
    await this.submitButton.click()
  }
}
