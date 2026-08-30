import { type Locator, type Page } from '@playwright/test'

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
 */
export class AccountPage {
  readonly page: Page
  readonly accountCardHeading: Locator

  constructor(page: Page) {
    this.page = page
    this.accountCardHeading = page.getByRole('heading', {
      name: 'アカウント認証',
    })
  }

  /** 認証情報ページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/profile/account')
  }

  /** アカウント認証カード内のメールアドレスロケータを返す */
  emailText(email: string): Locator {
    return this.page.getByText(email).first()
  }
}
