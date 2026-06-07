import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { endTestTouring, startTestTouring } from '../../helpers/touringHelper'

test.describe('ツーリング中TOPページ（全画面モード）', () => {
  test('ツーリング開始後、ホームページが全画面ツーリングモードに切り替わる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'ツーリングモードテスト用バイク',
    })

    await startTestTouring(
      authToken,
      myUserBikeId,
      '全画面モードテストツーリング'
    )

    await page.goto('/app/home')

    // 全画面ツーリングモードビューが表示される
    await expect(
      page.locator('[data-testid="touring-mode-view"]')
    ).toBeVisible()
  })

  test('ツーリング中はホームページの通常セクション（給油・履歴）が非表示になる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '非表示テスト用バイク',
    })

    await startTestTouring(
      authToken,
      myUserBikeId,
      '通常セクション非表示テスト'
    )

    await page.goto('/app/home')

    // 全画面モードが表示される
    await expect(
      page.locator('[data-testid="touring-mode-view"]')
    ).toBeVisible()

    // 通常セクション（ツーリング開始グリッド）は表示されない
    await expect(
      page.locator('[data-testid="touring-section"]')
    ).not.toBeVisible()
  })

  test('ツーリング中に「ツーリングを終了」ボタンが表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '終了ボタンテスト用バイク',
    })

    await startTestTouring(authToken, myUserBikeId, '終了ボタン表示テスト')

    await page.goto('/app/home')

    await expect(
      page.locator('[data-testid="touring-mode-view"]')
    ).toBeVisible()

    // 終了ボタンが表示される
    await expect(
      page.getByRole('button', { name: 'ツーリングを終了' })
    ).toBeVisible()
  })

  test('ツーリングを終了すると通常のホームページに戻る', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '終了フローテスト用バイク',
    })

    const touringId = await startTestTouring(
      authToken,
      myUserBikeId,
      '終了フローテストツーリング'
    )

    await page.goto('/app/home')

    // 全画面モードが表示されることを確認
    await expect(
      page.locator('[data-testid="touring-mode-view"]')
    ).toBeVisible()

    // API経由でツーリングを終了する（UIのモーダル操作を省略）
    await endTestTouring(authToken, myUserBikeId, touringId)

    await page.reload()

    // 通常のホームページに戻る（touring-section が表示される）
    await expect(page.locator('[data-testid="touring-section"]')).toBeVisible()
  })
})
