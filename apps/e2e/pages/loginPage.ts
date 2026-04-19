import { type Locator, type Page } from '@playwright/test'

/**
 * ログインページの Page Object Model
 *
 * @remarks
 * LoginCard.tsx のフォーム要素に対応。
 * - `#email`: メールアドレス入力欄
 * - `#password`: パスワード入力欄
 * - `button[type="submit"]`: ログインボタン
 * - `[role="alert"]`: ErrorMessage コンポーネント
 */
export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('#email')
    this.passwordInput = page.locator('#password')
    this.submitButton = page.locator('button[type="submit"]')
    this.errorMessage = page.locator('[role="alert"]')
  }

  /** ログインページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/login')
  }

  /**
   * メールアドレスとパスワードでログインする
   *
   * @param email - メールアドレス
   * @param password - パスワード
   */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  /** ホームページへのリダイレクトを待つ */
  async waitForRedirectToHome(): Promise<void> {
    await this.page.waitForURL(/\/app\/home/, { timeout: 15_000 })
  }
}
