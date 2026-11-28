import { type Locator, type Page } from '@playwright/test'
import { completeEmulatorGoogleSignIn } from '../helpers/googleEmulatorPopup'

/**
 * 新規登録ページの Page Object Model
 *
 * @remarks
 * /app/register（RegisterCard.tsx）に対応。
 */
export class RegisterPage {
  readonly page: Page
  readonly googleRegisterButton: Locator
  readonly googlePolicyNote: Locator
  readonly nameInput: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly submitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.nameInput = page.locator('#name')
    this.emailInput = page.locator('#email')
    this.passwordInput = page.locator('#password')
    this.confirmPasswordInput = page.locator('#confirmPassword')
    this.submitButton = page.getByRole('button', {
      name: '登録する',
      exact: true,
    })
    this.googleRegisterButton = page.getByRole('button', {
      name: 'Googleで登録',
    })
    this.googlePolicyNote = page.getByText('Googleで登録することで')
  }

  /** 新規登録ページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/register')
  }

  /**
   * Auth Emulator のダミー画面で新規 Google アカウントを追加して登録する
   *
   * @param email - Google アカウントとして使うメールアドレス
   * @param displayName - Google アカウントの表示名
   */
  async registerWithGoogle(email: string, displayName: string): Promise<void> {
    const popupPromise = this.page.waitForEvent('popup')
    await this.googleRegisterButton.click()
    await completeEmulatorGoogleSignIn(await popupPromise, email, displayName)
  }

  /**
   * メールアドレスとパスワードで新規登録する
   *
   * @param values - ユーザー名・メールアドレス・パスワード
   */
  async registerWithEmail(values: {
    name: string
    email: string
    password: string
  }): Promise<void> {
    await this.nameInput.fill(values.name)
    await this.emailInput.fill(values.email)
    await this.passwordInput.fill(values.password)
    await this.confirmPasswordInput.fill(values.password)
    await this.submitButton.click()
  }

  /** ホームページへのリダイレクトを待つ */
  async waitForRedirectToHome(): Promise<void> {
    await this.page.waitForURL(/\/app\/home/, { timeout: 15_000 })
  }
}
