import { expect } from '@playwright/test'
import { test } from '../../fixtures/authenticatedPage'
import { issueTestApiKey } from '../../helpers/apiKeyHelper'
import { ApiKeysPage } from '../../pages/apiKeysPage'

/**
 * APIキー管理ページ E2E テスト
 *
 * @remarks
 * /app/settings/api-keys のスコープ選択機能を含む APIキー発行フローを検証する。
 */
test.describe('APIキー管理', () => {
  test('ページが正常に表示され「＋ 追加」ボタンが存在する', async ({
    authenticatedPage,
  }) => {
    const apiKeysPage = new ApiKeysPage(authenticatedPage)
    await apiKeysPage.goto()

    await expect(apiKeysPage.heading).toBeVisible()
    await expect(apiKeysPage.addButton).toBeVisible()
  })

  test('「＋ 追加」ボタンをクリックすると発行モーダルが開く', async ({
    authenticatedPage,
  }) => {
    const apiKeysPage = new ApiKeysPage(authenticatedPage)
    await apiKeysPage.goto()
    await apiKeysPage.openAddModal()

    await expect(apiKeysPage.modalHeading).toBeVisible()
  })

  test('モーダルにアクセス権限セクションが表示される', async ({
    authenticatedPage,
  }) => {
    const apiKeysPage = new ApiKeysPage(authenticatedPage)
    await apiKeysPage.goto()
    await apiKeysPage.openAddModal()

    // 「アクセス権限」の見出しが表示される
    await expect(
      authenticatedPage.getByText('アクセス権限')
    ).toBeVisible()
  })

  test('READ チェックボックスがチェック済みかつ無効（disabled）になっている', async ({
    authenticatedPage,
  }) => {
    const apiKeysPage = new ApiKeysPage(authenticatedPage)
    await apiKeysPage.goto()
    await apiKeysPage.openAddModal()

    // 「読み取り（READ）— 必須」が checked かつ disabled
    await expect(apiKeysPage.readScopeCheckbox).toBeChecked()
    await expect(apiKeysPage.readScopeCheckbox).toBeDisabled()
  })

  test('FREEプランでは WRITE チェックボックスが表示されない', async ({
    authenticatedPage,
  }) => {
    const apiKeysPage = new ApiKeysPage(authenticatedPage)
    await apiKeysPage.goto()
    await apiKeysPage.openAddModal()

    // FREEプランではWRITEスコープは表示されない
    const writeCheckbox = authenticatedPage.getByRole('checkbox', {
      name: /WRITE/,
    })
    await expect(writeCheckbox).not.toBeVisible()
  })

  test('キー名未入力時は発行ボタンが disabled になっている', async ({
    authenticatedPage,
  }) => {
    const apiKeysPage = new ApiKeysPage(authenticatedPage)
    await apiKeysPage.goto()
    await apiKeysPage.openAddModal()

    // キー名が空の状態では発行ボタンが無効
    await expect(apiKeysPage.issueButton).toBeDisabled()
  })

  test('正常系: キー名を入力して APIキーを発行できる', async ({
    authenticatedPage,
  }) => {
    const apiKeysPage = new ApiKeysPage(authenticatedPage)
    await apiKeysPage.goto()
    await apiKeysPage.openAddModal()
    await apiKeysPage.issueApiKey('Test Key from Playwright')

    // 発行完了モーダルが表示され、フルキーが表示される
    await expect(apiKeysPage.issuedModalHeading).toBeVisible()
    // フルキーの先頭プレフィックス形式 mk_ で始まるテキストが存在する
    await expect(
      authenticatedPage.getByText(/mk_[0-9a-f]+_/)
    ).toBeVisible()
  })

  test('発行後に一覧へスコープバッジ「読み取り」が表示される', async ({
    authenticatedPage,
  }) => {
    const apiKeysPage = new ApiKeysPage(authenticatedPage)
    await apiKeysPage.goto()
    await apiKeysPage.openAddModal()
    await apiKeysPage.issueApiKey('Scope Badge Test Key')
    await apiKeysPage.closeIssuedModal()

    // 一覧にキー名とスコープバッジが表示される
    await expect(apiKeysPage.keyListItem('Scope Badge Test Key')).toBeVisible()
    await expect(apiKeysPage.scopeBadge('読み取り')).toBeVisible()
  })

  test('API 経由で発行したキーが一覧に表示される', async ({
    authenticatedPage,
    authToken,
  }) => {
    // API経由でキーを事前作成
    await issueTestApiKey(authToken, 'Pre-issued Key via API')

    const apiKeysPage = new ApiKeysPage(authenticatedPage)
    await apiKeysPage.goto()

    await expect(apiKeysPage.keyListItem('Pre-issued Key via API')).toBeVisible()
  })
})
