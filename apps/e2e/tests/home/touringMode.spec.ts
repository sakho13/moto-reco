import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { endTestTouring, startTestTouring } from '../../helpers/touringHelper'
import {
  addTouringPlanSpot,
  registerTestTouringPlan,
  startTouringFromPlan,
} from '../../helpers/touringPlanHelper'

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

    // 通常セクション（主アクション）は表示されない
    await expect(page.locator('[data-testid="home-actions"]')).not.toBeVisible()
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

    // 通常のホームページに戻る（home-actions が表示される）
    await expect(page.locator('[data-testid="home-actions"]')).toBeVisible()
  })

  test('スポットをスキップすると次のスポットへ進み、すべてスキップすると到達の案内を出さない', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'スキップ進行テストバイク',
    })
    const touringPlanId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      'スキップ進行テストプラン'
    )
    for (const [index, name] of ['1つ目の寄り道', '2つ目の寄り道'].entries()) {
      await addTouringPlanSpot(authToken, myUserBikeId, touringPlanId, {
        type: 'SPOT',
        name,
        latitude: 35.5 - index * 0.1,
        longitude: 138.5,
      })
    }
    await startTouringFromPlan(authToken, myUserBikeId, touringPlanId)

    await page.goto('/app/home')

    const touringMode = page.getByTestId('touring-mode-view')
    const skipButton = touringMode.getByRole('button', {
      name: 'スキップ',
      exact: true,
    })
    await expect(touringMode.getByText('1つ目の寄り道')).toBeVisible({
      timeout: 15_000,
    })

    await skipButton.click()
    await expect(touringMode.getByText('2つ目の寄り道')).toBeVisible({
      timeout: 10_000,
    })
    await expect(touringMode.getByText('1つ目の寄り道')).toHaveCount(0)

    await skipButton.click()
    await expect(touringMode.getByText('2つ目の寄り道')).toHaveCount(0, {
      timeout: 10_000,
    })
    await expect(skipButton).toHaveCount(0)
    await expect(touringMode.getByText('全スポットに到達しました')).toHaveCount(
      0
    )
  })
})
