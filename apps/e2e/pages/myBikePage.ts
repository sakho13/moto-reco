import { type Locator, type Page } from '@playwright/test'

/**
 * 愛車詳細ページの Page Object Model
 *
 * @remarks
 * /app/my-bike に対応。「マイバイク」一覧は中継ページ化していたため廃止し、
 * アクティブ車両の詳細（/app/my-bike/{id}）へ直接遷移する構成になった
 * （Issue #575「愛車画面の再構成」）。バイクが0台のときのみ登録導線（空状態）を表示する。
 */
export class MyBikePage {
  readonly page: Page
  readonly emptyMessage: Locator
  readonly emptyRegisterButton: Locator
  readonly editButton: Locator
  readonly primaryFuelButton: Locator
  readonly maintenanceScheduleSection: Locator
  readonly maintenanceMoreLink: Locator
  readonly recordLinksSection: Locator
  readonly heroSection: Locator
  readonly etcArticleLink: Locator
  readonly editEtcSelect: Locator
  readonly editSubmitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.emptyMessage = page.getByText('まだバイクが登録されていません')
    this.emptyRegisterButton = page.getByRole('button', {
      name: '最初のバイクを登録',
    })
    this.editButton = page.getByRole('button', { name: '愛車情報を編集' })
    this.primaryFuelButton = page.getByRole('button', { name: '給油を記録' })
    this.maintenanceScheduleSection = page.getByTestId(
      'maintenance-schedule-section'
    )
    this.maintenanceMoreLink = this.maintenanceScheduleSection.getByRole(
      'link',
      { name: 'メンテナンス履歴を見る' }
    )
    // 件数付きの記録リンク行（`BikeRecordLinks`）。テストIDでスコープしないと、
    // 「メンテナンス」は点検の予定セクションの「メンテナンス履歴を見る」リンク
    // （`maintenanceMoreLink`）ともマッチしてしまう。
    this.recordLinksSection = page.getByTestId('bike-record-links')
    // 見出しと車両情報（`BikeHeroSection`）
    this.heroSection = page.getByTestId('bike-hero-section')
    // ETC未設定・未搭載のときだけ車両情報の下に出る解説記事への導線
    this.etcArticleLink = this.heroSection.getByRole('link', {
      name: 'ETCのメリットを見る',
    })
    // 愛車情報の編集モーダル（`MyBikeEditForm`）
    this.editEtcSelect = page.getByLabel('ETC車載器')
    this.editSubmitButton = page.getByRole('button', { name: '更新する' })
  }

  /** マイバイクのエントリーポイントへ遷移する（アクティブ車両の詳細へ直行する） */
  async goto(): Promise<void> {
    await this.page.goto('/app/my-bike')
  }

  /** 特定バイクの詳細ページへ直接遷移する */
  async gotoBike(myUserBikeId: string): Promise<void> {
    await this.page.goto(`/app/my-bike/${myUserBikeId}`)
  }

  /** 見出し（バイク名）のロケーターを取得する */
  heading(name: string | RegExp): Locator {
    return this.page.getByRole('heading', { name, level: 1 })
  }

  /**
   * 車両情報の1行の値のロケーターを取得する
   *
   * @remarks
   * 車両情報は `<dl>` の各行（`<div><dt>ラベル</dt><dd>値</dd></div>`）で構成される。
   * 「未設定」などの値は複数行に出るため、ラベルで行を絞り込んでから値を取る。
   */
  specValue(label: string): Locator {
    return this.heroSection
      .locator('dl > div')
      .filter({
        has: this.page.getByRole('term').getByText(label, { exact: true }),
      })
      .getByRole('definition')
  }

  /** 愛車情報の編集モーダルでETC車載器の搭載状況を選んで更新する */
  async updateEtcType(label: string): Promise<void> {
    await this.editButton.click()
    await this.editEtcSelect.selectOption({ label })
    await this.editSubmitButton.click()
    await this.editSubmitButton.waitFor({ state: 'detached' })
  }

  /** 記録へのリンク行（例:「給油履歴」「ツーリング」「メンテナンス」）のロケーターを取得する */
  recordLink(label: string): Locator {
    return this.recordLinksSection.getByRole('link', {
      name: new RegExp(label),
    })
  }
}
