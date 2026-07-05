import { type Locator, type Page } from '@playwright/test'

/**
 * APIキー管理ページの Page Object Model
 *
 * @remarks
 * /app/settings/api-keys に対応。
 * MCP APIキーの発行・一覧表示・削除を操作する。
 */
export class ApiKeysPage {
  readonly page: Page
  readonly heading: Locator
  readonly addButton: Locator

  // 発行モーダル
  readonly modalHeading: Locator
  readonly keyNameInput: Locator
  readonly readScopeCheckbox: Locator
  readonly issueButton: Locator

  // 発行完了モーダル
  readonly issuedModalHeading: Locator
  readonly fullKeyDisplay: Locator
  readonly closeButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', {
      name: 'MCP APIキー管理',
      level: 1,
    })
    this.addButton = page.getByRole('button', { name: '＋ 追加' })

    // 発行モーダル
    this.modalHeading = page.getByRole('heading', {
      name: '新規APIキー発行',
      level: 2,
    })
    this.keyNameInput = page.getByRole('textbox', {
      name: 'キー名（例: My Claude Code）',
    })
    this.readScopeCheckbox = page.getByRole('checkbox', {
      name: '読み取り（READ）— 必須',
    })
    this.issueButton = page.getByRole('button', { name: 'APIキーを発行する' })

    // 発行完了モーダル
    this.issuedModalHeading = page.getByRole('heading', {
      name: 'APIキーを発行しました',
      level: 2,
    })
    this.fullKeyDisplay = page.locator(
      '[role="dialog"] code, [role="dialog"] p'
    )
    this.closeButton = page.getByRole('button', { name: '閉じる' })
  }

  /** APIキー管理ページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/settings/api-keys')
  }

  /** 「＋ 追加」ボタンをクリックして発行モーダルを開く */
  async openAddModal(): Promise<void> {
    await this.addButton.click()
    await this.modalHeading.waitFor({ state: 'visible', timeout: 10_000 })
  }

  /**
   * APIキーを発行する
   *
   * @param keyName - キーに付ける名前
   */
  async issueApiKey(keyName: string): Promise<void> {
    await this.keyNameInput.fill(keyName)
    await this.issueButton.click()
    await this.issuedModalHeading.waitFor({ state: 'visible', timeout: 15_000 })
  }

  /** 発行完了モーダルの「閉じる」ボタンをクリックする */
  async closeIssuedModal(): Promise<void> {
    await this.closeButton.last().click()
    await this.issuedModalHeading.waitFor({ state: 'hidden', timeout: 10_000 })
  }

  /**
   * キー名で一覧アイテムのロケーターを返す
   *
   * @param keyName - 検索するキー名
   */
  keyListItem(keyName: string): Locator {
    return this.page.getByText(keyName)
  }

  /**
   * 一覧に表示されたスコープバッジのロケーターを返す
   *
   * @param scopeLabel - バッジのテキスト（例: "読み取り"）
   */
  scopeBadge(scopeLabel: string): Locator {
    return this.page.getByText(scopeLabel).first()
  }
}
