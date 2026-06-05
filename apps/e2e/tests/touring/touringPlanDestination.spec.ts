import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'

const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000'

async function registerTestTouringPlan(
  token: string,
  myUserBikeId: string,
  title: string
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/api/v1/user-bike/bike/${myUserBikeId}/tourings`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        startDate: new Date('2026-07-01').toISOString(),
        endDate: new Date('2026-07-03').toISOString(),
        status: 'PLANNED',
      }),
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(`プラン登録失敗: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { data: { touringId: string } }
  return json.data.touringId
}

test.describe('ツーリングプラン 終着地登録', () => {
  test('PLANNEDステータスでも終着地セクションが表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '終着地テストバイク',
    })

    const touringId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '終着地テスト用プラン'
    )

    await page.goto(`/app/my-bike/${myUserBikeId}/tourings/${touringId}`)

    // PLANNEDステータスのバッジが表示されている（タイトルと区別するため exact + first）
    await expect(
      page.getByText('プラン', { exact: true }).first()
    ).toBeVisible({ timeout: 10_000 })

    // 終着地セクションが表示される（修正前は COMPLETED のみ）
    await expect(page.getByText('終着地', { exact: true })).toBeVisible({
      timeout: 5_000,
    })
  })

  test('PLANNEDステータスで終着地の編集ボタンが存在する', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '終着地編集テストバイク',
    })

    const touringId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '終着地編集テスト用プラン'
    )

    await page.goto(`/app/my-bike/${myUserBikeId}/tourings/${touringId}`)
    await expect(
      page.getByText('プラン', { exact: true }).first()
    ).toBeVisible({ timeout: 10_000 })

    // 終着地の編集ボタン（aria-label="終着地を編集"）が存在する
    await expect(
      page.getByRole('button', { name: '終着地を編集' })
    ).toBeVisible({ timeout: 5_000 })
  })

  test('PLANNEDステータスで終着地を編集モーダルで設定できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '終着地モーダルテストバイク',
    })

    const touringId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '終着地モーダルテスト用プラン'
    )

    await page.goto(`/app/my-bike/${myUserBikeId}/tourings/${touringId}`)
    await expect(
      page.getByText('プラン', { exact: true }).first()
    ).toBeVisible({ timeout: 10_000 })

    // 終着地の編集ボタンをクリック
    await page.getByRole('button', { name: '終着地を編集' }).click()

    // 位置設定モーダルが開く（タイトルが「終着地を設定」）
    await expect(page.getByText('終着地を設定')).toBeVisible({ timeout: 5_000 })
  })
})
