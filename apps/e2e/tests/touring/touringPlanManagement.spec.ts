import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { registerTestTouringPlan } from '../../helpers/touringPlanHelper'

test.describe('ツーリングプラン管理', () => {
  test('プランが無い場合、一覧に案内文と「プランを作成」ボタンが表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '一覧テストバイク',
    })

    await page.goto(`/app/my-bike/${myUserBikeId}/touring-plans`)

    await expect(
      page.getByText('ツーリングプランはまだ登録されていません')
    ).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByRole('button', { name: 'プランを作成' })
    ).toBeVisible()
  })

  test('プランを新規作成すると詳細ページに遷移し、一覧にも表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '作成テストバイク',
    })

    await page.goto(`/app/my-bike/${myUserBikeId}/touring-plans/register`)

    await page.getByLabel('タイトル').fill('新ツーリングプラン')
    await page.getByRole('button', { name: 'プランを作成' }).click()

    await expect(page).toHaveURL(
      new RegExp(`/app/my-bike/${myUserBikeId}/touring-plans/[^/]+$`),
      { timeout: 10_000 }
    )
    await expect(
      page.getByRole('heading', { name: '新ツーリングプラン' })
    ).toBeVisible()

    await page.goto(`/app/my-bike/${myUserBikeId}/touring-plans`)
    await expect(page.getByText('新ツーリングプラン')).toBeVisible({
      timeout: 10_000,
    })
  })

  test('プラン詳細ページでタイトルを編集できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '編集テストバイク',
    })
    const touringPlanId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '編集前プラン'
    )

    await page.goto(
      `/app/my-bike/${myUserBikeId}/touring-plans/${touringPlanId}`
    )

    // 編集ボタン（最初のものがプラン情報の編集）をクリックして編集モーダルを開く
    await page.getByRole('button', { name: '編集' }).first().click()
    await expect(
      page.getByRole('heading', { name: 'プランを編集' })
    ).toBeVisible({ timeout: 5_000 })

    await page.locator('#planEditTitle').fill('編集後プラン')
    await page.getByRole('button', { name: '更新する' }).click()

    await expect(
      page.getByRole('heading', { name: '編集後プラン' })
    ).toBeVisible({ timeout: 10_000 })
  })

  test('プラン詳細ページからプランを削除できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '削除テストバイク',
    })
    const touringPlanId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '削除対象プラン'
    )

    await page.goto(
      `/app/my-bike/${myUserBikeId}/touring-plans/${touringPlanId}`
    )

    await page.getByRole('button', { name: '編集' }).first().click()
    await expect(
      page.getByRole('button', { name: '削除', exact: true })
    ).toBeVisible({ timeout: 5_000 })

    await page.getByRole('button', { name: '削除', exact: true }).click()
    await expect(
      page.getByRole('button', { name: '削除する', exact: true })
    ).toBeVisible({ timeout: 5_000 })
    await page.getByRole('button', { name: '削除する', exact: true }).click()

    await expect(page).toHaveURL(
      new RegExp(`/app/my-bike/${myUserBikeId}/touring-plans$`),
      { timeout: 10_000 }
    )
    await expect(page.getByText('削除対象プラン')).not.toBeVisible({
      timeout: 10_000,
    })
  })

  test('「このプランで開始する」からツーリングを開始できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '開始テストバイク',
      totalMileage: 1000,
    })
    const touringPlanId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '開始用プラン'
    )

    await page.goto(
      `/app/my-bike/${myUserBikeId}/touring-plans/${touringPlanId}`
    )

    await page.getByRole('button', { name: 'このプランで開始する' }).click()
    await expect(
      page.getByText(
        '今すぐ開始すると、現在地と現在時刻でツーリングが記録されます。'
      )
    ).toBeVisible({ timeout: 5_000 })

    await page.getByRole('button', { name: '開始する', exact: true }).click()

    await expect(page).toHaveURL(/\/app\/home/, { timeout: 15_000 })
    await expect(page.locator('[data-testid="touring-mode-view"]')).toBeVisible(
      { timeout: 15_000 }
    )
  })
})
