import { type Locator, type Page } from '@playwright/test'

/**
 * ヘッダーのアクティブ車両セレクタ（BikeSwitcher）の Page Object Model
 *
 * @remarks
 * `components/Navigation/BikeSwitcher.tsx` に対応。モバイル・デスクトップ両方の
 * ヘッダーに配置されているが、CSSで一方のみが表示されるため、
 * `getByRole` は常に表示中の1要素にマッチする。
 * バイクが1台以上登録されていればトリガーボタンが表示されドロップダウンを
 * 開ける（1台のときは車両の切り替え先はないが、「バイクを追加」導線として
 * 開ける必要があるため）。ドロップダウン最下部には常に「バイクを追加」が
 * あり、`/app/bike/register` へ遷移できる。台数上限に達している場合は
 * 押せない状態になる。
 */
export class BikeSwitcherPage {
  readonly page: Page
  readonly trigger: Locator
  readonly addBikeButton: Locator

  constructor(page: Page) {
    this.page = page
    this.trigger = page.getByRole('button', { name: /^アクティブ車両: / })
    // exact指定が無いと、トリガーのaria-label（「タップしてバイクを追加する」を
    // 含む）にも部分一致してしまい strict mode violation になる
    this.addBikeButton = page.getByRole('button', {
      name: 'バイクを追加',
      exact: true,
    })
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
