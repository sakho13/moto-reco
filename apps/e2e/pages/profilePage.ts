import { type Locator, type Page } from '@playwright/test'
import { completeEmulatorGoogleSignIn } from '../helpers/googleEmulatorPopup'

/**
 * プロフィールページの Page Object Model
 *
 * @remarks
 * /app/profile に対応。
 * - プロフィールカード (BaseCard title="プロフィール")
 * - プロフィール編集モーダル (ProfileEditModal)
 * - オプションカード (認証情報リンク、プランリンク、MCP接続方法リンク)
 * - ログアウトボタン (LogoutButton)
 */
export class ProfilePage {
  readonly page: Page
  readonly profileCardHeading: Locator
  readonly authInfoLink: Locator
  readonly planLink: Locator
  readonly logoutButton: Locator
  readonly editButton: Locator
  readonly editModal: Locator
  readonly nameInput: Locator
  readonly notificationEmailInput: Locator
  readonly saveButton: Locator
  readonly pendingEmailNote: Locator

  constructor(page: Page) {
    this.page = page
    this.profileCardHeading = page.getByRole('heading', {
      name: 'プロフィール',
    })
    this.authInfoLink = page.getByRole('link', { name: '認証情報' })
    this.planLink = page.getByRole('link', { name: 'プラン' })
    this.logoutButton = page.getByRole('button', { name: /ログアウト/ })
    this.editButton = page.getByRole('button', { name: 'プロフィールを編集' })
    this.editModal = page.getByRole('dialog')
    this.nameInput = page.locator('#modal-profile-name')
    this.notificationEmailInput = page.locator(
      '#modal-profile-notification-email'
    )
    this.saveButton = this.editModal.getByRole('button', { name: '保存' })
    this.pendingEmailNote = page.getByRole('status').filter({
      hasText: 'に確認メールを送信しました',
    })
  }

  /**
   * プロフィール編集モーダルを開いて入力し、保存する
   *
   * @param values - 指定した項目だけ入力し直す
   */
  async editProfile(values: {
    name?: string
    notificationEmail?: string
  }): Promise<void> {
    await this.editButton.click()
    if (values.name !== undefined) await this.nameInput.fill(values.name)
    if (values.notificationEmail !== undefined) {
      await this.notificationEmailInput.fill(values.notificationEmail)
    }
    await this.saveButton.click()
    await this.editModal.waitFor({ state: 'hidden', timeout: 15_000 })
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
  readonly quitCardHeading: Locator
  readonly quitModal: Locator
  readonly quitReasonInput: Locator

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
    this.quitCardHeading = page.getByRole('heading', {
      name: '退会',
      exact: true,
    })
    this.quitModal = page.getByRole('dialog')
    this.quitReasonInput =
      this.quitModal.getByPlaceholder('退会理由を入力してください')
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
   * 退会理由を入力して退会し、退会手続き完了ページへの遷移を待つ
   *
   * @param reason - 退会理由
   */
  async quit(reason: string): Promise<void> {
    await this.page.getByRole('button', { name: '退会する' }).click()
    await this.quitReasonInput.fill(reason)
    await this.quitModal.getByRole('button', { name: '次へ' }).click()
    await this.quitModal.getByRole('button', { name: '退会する' }).click()
    await this.page.waitForURL(/\/app\/quit-complete/, { timeout: 15_000 })
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
