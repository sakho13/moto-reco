import { type Locator, type Page } from '@playwright/test'

/**
 * ヘッダーのアクティブ車両セレクタ（BikeSwitcher）の Page Object Model
 *
 * @remarks
 * `components/Navigation/BikeSwitcher.tsx` に対応。モバイル・デスクトップ両方の
 * ヘッダーに配置されているが、CSSで一方のみが表示されるため、
 * `getByRole` は常に表示中の1要素にマッチする。
 * バイクが2台以上登録されているときのみトリガーボタンが表示される
 * （1台のみの場合は名称のみが表示され、切り替えUIは出ない）。
 */
export class BikeSwitcherPage {
  readonly page: Page
  readonly trigger: Locator

  constructor(page: Page) {
    this.page = page
    this.trigger = page.getByRole('button', { name: /^アクティブ車両: / })
  }

  /** ドロップダウンを開く */
  async open(): Promise<void> {
    await this.trigger.click()
  }

  /**
   * 指定した車両名を選択してアクティブ車両を切り替える
   *
   * @remarks
   * 選択肢の accessible name は「車両名＋排気量・走行距離」の連結のため、
   * 部分一致（デフォルトの文字列マッチ）で車両名のみ指定すればよい。
   */
  async selectBike(bikeName: string): Promise<void> {
    await this.open()
    await this.page.getByRole('option', { name: bikeName }).click()
  }
}
