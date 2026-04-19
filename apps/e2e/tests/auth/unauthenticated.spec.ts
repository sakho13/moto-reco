import { expect, test } from '@playwright/test'

/**
 * 未認証アクセスのリダイレクト E2E テスト
 *
 * @remarks
 * 認証が必要なページへ未認証でアクセスした場合、
 * ログインページへリダイレクトされることを確認する。
 */
test.describe('未認証アクセスのリダイレクト', () => {
  test('ホームページへ未認証でアクセスするとログインへリダイレクトされる', async ({
    page,
  }) => {
    await page.goto('/app/home')
    await expect(page).toHaveURL(/\/app\/login/, { timeout: 10_000 })
  })

  test('マイバイクページへ未認証でアクセスするとログインへリダイレクトされる', async ({
    page,
  }) => {
    await page.goto('/app/my-bike')
    await expect(page).toHaveURL(/\/app\/login/, { timeout: 10_000 })
  })

  test('プロフィールページへ未認証でアクセスするとログインへリダイレクトされる', async ({
    page,
  }) => {
    await page.goto('/app/profile')
    await expect(page).toHaveURL(/\/app\/login/, { timeout: 10_000 })
  })

  test('ログインページは未認証でアクセスできる', async ({ page }) => {
    await page.goto('/app/login')
    await expect(page).toHaveURL(/\/app\/login/)
  })
})
