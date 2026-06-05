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

test.describe('ツーリングプラン機能', () => {
  test('ツーリング一覧ページに「登録する」ボタンが表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'テストバイク',
    })

    await page.goto(`/app/my-bike/${myUserBikeId}/tourings`)

    // 「登録する」ボタンが表示される
    await expect(
      page.getByRole('button', { name: '登録する', exact: true })
    ).toBeVisible()

    // セクションが分かれていないことを確認（「ツーリングプラン」セクションは存在しない）
    await expect(page.getByText('ツーリングプラン')).not.toBeAttached()
  })

  test('登録ページにモード切り替えが表示され、プランモードに切り替えられる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'フォームテストバイク',
    })

    await page.goto(`/app/my-bike/${myUserBikeId}/tourings/register`)

    // モード切り替えボタンが表示される
    await expect(
      page.getByRole('button', { name: 'ツーリングを記録' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'プランを作成' })
    ).toBeVisible()

    // 初期状態は「ツーリングを記録」モード
    await expect(page.getByLabel('開始日')).toBeVisible()

    // 「プランを作成」に切り替え
    await page.getByRole('button', { name: 'プランを作成' }).click()

    // ラベルが変わることを確認
    await expect(page.getByLabel('出発予定日')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'プランを保存' })
    ).toBeVisible()
  })

  test('プランを作成するとプラン一覧に表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '作成テストバイク',
    })

    await page.goto(`/app/my-bike/${myUserBikeId}/tourings/register`)

    // プランモードに切り替え
    await page.getByRole('button', { name: 'プランを作成' }).click()

    // タイトルを入力
    await page.getByLabel('タイトル').fill('夏の北海道ツーリングプラン')
    await page.getByLabel('出発予定日').fill('2026-07-10')
    await page.getByLabel('帰着予定日').fill('2026-07-15')

    // プランを保存
    await page.getByRole('button', { name: 'プランを保存' }).click()

    // ツーリング一覧ページへリダイレクト
    await expect(page).toHaveURL(
      new RegExp(`/app/my-bike/${myUserBikeId}/tourings`),
      { timeout: 10_000 }
    )

    // プランが一覧に表示される
    await expect(
      page.getByRole('heading', { name: '夏の北海道ツーリングプラン' }).first()
    ).toBeVisible({ timeout: 10_000 })

    // プランバッジが表示される
    await expect(page.getByText('プラン').first()).toBeVisible()
  })

  test('過去のツーリングを記録モードで登録できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '記録テストバイク',
      totalMileage: 10000,
    })

    await page.goto(`/app/my-bike/${myUserBikeId}/tourings/register`)

    // 初期状態は「ツーリングを記録」モード - ラベルを確認
    await expect(page.getByLabel('開始日')).toBeVisible()
    await expect(page.getByLabel('終了日')).toBeVisible()

    await page.getByLabel('タイトル').fill('先週の伊豆ツーリング')
    await page.getByLabel('開始日').fill('2026-05-24')
    await page.getByLabel('終了日').fill('2026-05-25')
    await page.getByLabel('開始時走行距離 (km)').fill('10000')
    await page.getByLabel('終了時走行距離 (km)').fill('10300')

    await page.getByRole('button', { name: '登録する' }).click()

    await expect(page).toHaveURL(
      new RegExp(`/app/my-bike/${myUserBikeId}/tourings`),
      { timeout: 10_000 }
    )

    await expect(
      page.getByRole('heading', { name: '先週の伊豆ツーリング' }).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('詳細ページの「ツーリングを開始する」ボタンでツーリング開始できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '開始テストバイク',
      totalMileage: 5000,
    })

    const touringId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '開始テスト用プラン'
    )

    // 詳細ページへ直接遷移
    await page.goto(`/app/my-bike/${myUserBikeId}/tourings/${touringId}`)

    // 「ツーリングを開始する」ボタンが表示される
    await expect(
      page.getByRole('button', { name: 'ツーリングを開始する' })
    ).toBeVisible({ timeout: 10_000 })

    // クリック
    await page.getByRole('button', { name: 'ツーリングを開始する' }).click()

    // ホームページへリダイレクト
    await expect(page).toHaveURL(/\/app\/home/, { timeout: 15_000 })

    // ホームのツーリングセクションに進行中が表示される
    await expect(page.getByText('開始テスト用プラン')).toBeVisible({
      timeout: 10_000,
    })
  })

  test('一覧の行クリックで詳細ページへ遷移できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '詳細テストバイク',
    })

    const touringId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '詳細確認用プラン'
    )

    await page.goto(`/app/my-bike/${myUserBikeId}/tourings`)

    await expect(
      page.getByRole('heading', { name: '詳細確認用プラン' })
    ).toBeVisible({ timeout: 10_000 })

    // 行クリックで詳細へ遷移
    await page.getByRole('heading', { name: '詳細確認用プラン' }).click()

    await expect(page).toHaveURL(
      new RegExp(`/app/my-bike/${myUserBikeId}/tourings/${touringId}`),
      { timeout: 10_000 }
    )
  })

  test('詳細ページからプランを削除できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '削除テストバイク',
    })

    const touringId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '削除テスト用プラン'
    )

    // 詳細ページへ直接遷移
    await page.goto(`/app/my-bike/${myUserBikeId}/tourings/${touringId}`)

    // 編集ボタン（鉛筆アイコン）をクリックして編集モーダルを開く（最初のものがツーリング情報の編集）
    await page.getByRole('button', { name: '編集' }).first().click()

    // 編集モーダルが開く
    await expect(
      page.getByRole('button', { name: '削除', exact: true })
    ).toBeVisible({ timeout: 5_000 })

    // 「削除」をクリックして確認フェーズへ
    await page.getByRole('button', { name: '削除', exact: true }).click()

    // 「削除する」確認ボタンが表示される
    await expect(
      page.getByRole('button', { name: '削除する', exact: true })
    ).toBeVisible({ timeout: 5_000 })

    // 削除確認
    await page.getByRole('button', { name: '削除する', exact: true }).click()

    // 一覧ページへリダイレクト
    await expect(page).toHaveURL(
      new RegExp(`/app/my-bike/${myUserBikeId}/tourings`),
      { timeout: 10_000 }
    )

    // プランが削除されている
    await expect(
      page.getByRole('heading', { name: '削除テスト用プラン' })
    ).not.toBeVisible({ timeout: 10_000 })
  })
})
