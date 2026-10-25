import { type Page } from '@playwright/test'

/**
 * Auth Emulator のダミー Google ログイン画面で新規アカウントを追加して認証する
 *
 * @param popup - `signInWithPopup` / `linkWithPopup` で開いたポップアップ
 * @param email - Google アカウントとして使うメールアドレス
 * @param displayName - Google アカウントの表示名
 */
export async function completeEmulatorGoogleSignIn(
  popup: Page,
  email: string,
  displayName: string
): Promise<void> {
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
