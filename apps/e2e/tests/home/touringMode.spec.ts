import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'

const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000'

/**
 * API経由でツーリングを開始し、touringId を返す
 */
async function startTestTouring(
  token: string,
  myUserBikeId: string,
  title: string
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'start',
        title,
        startDate: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(`ツーリング開始失敗: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { data: { touringId: string } }
  return json.data.touringId
}

/**
 * API経由でツーリングを終了する
 */
async function endTestTouring(
  token: string,
  myUserBikeId: string,
  touringId: string
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'end',
        touringId,
        endDate: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(`ツーリング終了失敗: ${res.status} ${await res.text()}`)
  }
}

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
