import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import {
  addTouringPlanSpot,
  registerTestTouringPlan,
  setTouringPlanDestinationLocation,
  setTouringPlanStartLocation,
  startTouringFromPlan,
} from '../../helpers/touringPlanHelper'
import { TouringPlanListPage } from '../../pages/touringPlanListPage'

test.describe('ツーリングプラン管理', () => {
  test('プランが無い場合、一覧に案内文と「プランを作成」ボタンが表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '一覧テストバイク',
    })

    const touringPlanListPage = new TouringPlanListPage(page)
    await touringPlanListPage.goto(myUserBikeId)

    await expect(touringPlanListPage.noPlansMessage).toBeVisible({
      timeout: 10_000,
    })
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

    const touringPlanListPage = new TouringPlanListPage(page)
    await touringPlanListPage.goto(myUserBikeId)
    await expect(touringPlanListPage.planRow('新ツーリングプラン')).toBeVisible(
      {
        timeout: 10_000,
      }
    )
  })

  test('一覧の行に所要時間・経路・地点の数・走行回数が表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '一覧要約テストバイク',
    })
    const touringPlanId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '要約確認プラン'
    )
    await setTouringPlanStartLocation(authToken, myUserBikeId, touringPlanId, {
      latitude: 35.681236,
      longitude: 139.767125,
      name: '出発地点',
    })
    await addTouringPlanSpot(authToken, myUserBikeId, touringPlanId, {
      type: 'SPOT',
      name: '経由スポット',
      latitude: 35.5,
      longitude: 138.5,
      travelMinutesFromPrev: 60,
      stayMinutes: 30,
    })
    await setTouringPlanDestinationLocation(
      authToken,
      myUserBikeId,
      touringPlanId,
      {
        latitude: 35.170915,
        longitude: 136.881537,
        name: '目的地点',
        travelMinutesFromPrev: 60,
      }
    )
    await startTouringFromPlan(authToken, myUserBikeId, touringPlanId)

    const touringPlanListPage = new TouringPlanListPage(page)
    await touringPlanListPage.goto(myUserBikeId)

    const row = touringPlanListPage.planRow('要約確認プラン')
    await expect(row).toBeVisible({ timeout: 10_000 })
    await expect(row.getByText('出発地点 → 目的地点')).toBeVisible()
    await expect(row.getByRole('img', { name: '寄り道1か所' })).toBeVisible()
    await expect(row.getByText('走行記録 1件')).toBeVisible()
    await expect(row).toContainText('2時間30分')
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

    await page.getByRole('button', { name: 'プランを編集' }).click()
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

    await page.getByRole('button', { name: 'プランを編集' }).click()
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
