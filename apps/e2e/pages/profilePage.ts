import { type Locator, type Page } from '@playwright/test'
import { completeEmulatorGoogleSignIn } from '../helpers/googleEmulatorPopup'

/**
 * プロフィールページの Page Object Model
 *
 * @remarks
 * /app/profile に対応。
 * - プロフィールカード (BaseCard title="プロフィール")
 * - オプションカード (認証情報リンク、プランリンク、MCP接続方法リンク)
 * - ログアウトボタン (LogoutButton)
 */
export class ProfilePage {
  readonly page: Page
  readonly profileCardHeading: Locator
  readonly authInfoLink: Locator
  readonly planLink: Locator
  readonly logoutButton: Locator

  constructor(page: Page) {
    this.page = page
    this.profileCardHeading = page.getByRole('heading', {
      name: 'プロフィール',
    })
    this.authInfoLink = page.getByRole('link', { name: '認証情報' })
    this.planLink = page.getByRole('link', { name: 'プラン' })
    this.logoutButton = page.getByRole('button', { name: /ログアウト/ })
  }

  /** プロフィールページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/profile')
  }

  /** ログアウトを実行し、ログインページへのリダイレクトを待つ */
  async logout(): Promise<void> {
    await this.logoutButton.click()
    await this.page.waitForURL(/\/app\/login/, { timeout: 15_000 })
  }
}

/**
 * 認証情報ページの Page Object Model
 *
 * @remarks
 * /app/profile/account に対応。
 * - アカウント認証カード (BaseCard title="アカウント認証")
 * - 認証方式の切り替えボタンと切り替えモーダル
 */
export class AccountPage {
  readonly page: Page
  readonly accountCardHeading: Locator
  readonly providerRow: Locator
  readonly switchToGoogleButton: Locator
  readonly switchToEmailButton: Locator
  readonly switchModal: Locator
  readonly newPasswordInput: Locator
  readonly confirmPasswordInput: Locator

  constructor(page: Page) {
    this.page = page
    this.accountCardHeading = page.getByRole('heading', {
      name: 'アカウント認証',
    })
    this.providerRow = page.getByText('認証方式', { exact: true }).locator('..')
    this.switchToGoogleButton = page.getByRole('button', {
      name: 'Googleに切り替える',
    })
    this.switchToEmailButton = page.getByRole('button', {
      name: 'メール/パスワードに切り替える',
    })
    this.switchModal = page.getByRole('dialog')
    this.newPasswordInput = page.locator('#switch-password')
    this.confirmPasswordInput = page.locator('#switch-confirm-password')
  }

  /** 認証情報ページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/profile/account')
  }

  /** アカウント認証カード内のメールアドレスロケータを返す */
  emailText(email: string): Locator {
    return this.page.getByText(email).first()
  }

  /**
   * Auth Emulator のダミー画面で Google アカウントを選択し、Googleへ切り替える
   *
   * @param email - Google アカウントとして使うメールアドレス
   * @param displayName - Google アカウントの表示名
   */
  async switchToGoogle(email: string, displayName: string): Promise<void> {
    await this.switchToGoogleButton.click()
    const popupPromise = this.page.waitForEvent('popup')
    await this.switchModal
      .getByRole('button', { name: 'Googleアカウントを選択して切り替える' })
      .click()
    await completeEmulatorGoogleSignIn(await popupPromise, email, displayName)
  }

  /**
   * 新しいパスワードを設定してメール/パスワードへ切り替える
   *
   * @param password - 新しいパスワード
   */
  async switchToEmail(password: string): Promise<void> {
    await this.switchToEmailButton.click()
    await this.newPasswordInput.fill(password)
    await this.confirmPasswordInput.fill(password)
    await this.switchModal.getByRole('button', { name: '切り替える' }).click()
  }
}
