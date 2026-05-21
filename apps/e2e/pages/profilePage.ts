import { type Locator, type Page } from '@playwright/test'

/**
 * プロフィールページの Page Object Model
 *
 * @remarks
 * /app/profile に対応。
 * - プロフィールカード (BaseCard title="プロフィール")
 * - アカウント認証カード (BaseCard title="アカウント認証")
 * - ログアウトボタン (LogoutButton)
 */
export class ProfilePage {
  readonly page: Page
  readonly profileCardHeading: Locator
  readonly accountCardHeading: Locator
  readonly logoutButton: Locator

  constructor(page: Page) {
    this.page = page
    this.profileCardHeading = page.getByRole('heading', {
      name: 'プロフィール',
    })
    this.accountCardHeading = page.getByRole('heading', {
      name: 'アカウント認証',
    })
    this.logoutButton = page.getByRole('button', { name: /ログアウト/ })
  }

  /** プロフィールページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/profile')
  }

  /** アカウント認証カード内のメールアドレスロケータを返す */
  emailText(email: string): Locator {
    return this.page.getByText(email).first()
  }

  /** ログアウトを実行し、ログインページへのリダイレクトを待つ */
  async logout(): Promise<void> {
    await this.logoutButton.click()
    await this.page.waitForURL(/\/app\/login/, { timeout: 15_000 })
  }
}
