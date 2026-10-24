import { type Locator, type Page } from '@playwright/test'

/** Googleログインを有効化するクエリパラメータ付きのログインURL */
const GOOGLE_LOGIN_ENABLED_PATH = '/app/login?feature=google-login'

/**
 * ログインページの Page Object Model
 *
 * @remarks
 * LoginCard.tsx のフォーム要素に対応。
 * - `#email`: メールアドレス入力欄
 * - `#password`: パスワード入力欄
 * - `button[type="submit"]`: ログインボタン
 * - `[role="alert"]`: ErrorMessage コンポーネント
 * - 「Googleでログイン」ボタン: `?feature=google-login` 指定時のみ有効
 */
export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly googleLoginButton: Locator
  readonly googlePolicyNote: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('#email')
    this.passwordInput = page.locator('#password')
    this.submitButton = page.locator('button[type="submit"]')
    this.errorMessage = page.locator(
      '[role="alert"]:not(#__next-route-announcer__)'
    )
    this.googleLoginButton = page.getByRole('button', {
      name: 'Googleでログイン',
    })
    this.googlePolicyNote = page.getByText('Googleでログインすることで')
  }

  /** ログインページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/login')
  }

  /** Googleログインを有効化した状態でログインページへ遷移する */
  async gotoWithGoogleLogin(): Promise<void> {
    await this.page.goto(GOOGLE_LOGIN_ENABLED_PATH)
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

  /**
   * Auth Emulator のダミー画面で新規 Google アカウントを追加してログインする
   *
   * @param email - Google アカウントとして使うメールアドレス
   * @param displayName - Google アカウントの表示名
   */
  async loginWithGoogle(email: string, displayName: string): Promise<void> {
    const popupPromise = this.page.waitForEvent('popup')
    await this.googleLoginButton.click()
    const popup = await popupPromise
    await popup.waitForLoadState()

    const addAccountButton = popup.getByRole('button', {
      name: 'Add new account',
    })
    const emailInput = popup.locator('#email-input')
    await addAccountButton.or(emailInput).first().waitFor()
    if (await addAccountButton.isVisible()) {
      await addAccountButton.click()
    }

    await emailInput.fill(email)
    await popup.locator('#display-name-input').fill(displayName)
    await popup.getByRole('button', { name: 'Sign in with Google.com' }).click()
  }

  /** ホームページへのリダイレクトを待つ */
  async waitForRedirectToHome(): Promise<void> {
    await this.page.waitForURL(/\/app\/home/, { timeout: 15_000 })
  }
}
