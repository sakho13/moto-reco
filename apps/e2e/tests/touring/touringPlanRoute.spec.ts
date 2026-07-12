import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import {
  addTouringPlanSpot,
  registerTestTouringPlan,
  setTouringPlanDestinationLocation,
  setTouringPlanStartLocation,
} from '../../helpers/touringPlanHelper'

test.describe('ツーリングプラン詳細 - ルートタイムライン', () => {
  test('出発地・目的地が未設定の場合、プレースホルダ名と「未設定」の予定時刻が表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '未設定表示テストバイク',
    })
    const touringPlanId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '未設定表示テストプラン'
    )

    await page.goto(
      `/app/my-bike/${myUserBikeId}/touring-plans/${touringPlanId}`
    )

    await expect(page.getByText('出発地', { exact: true })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText('出発予定 未設定')).toBeVisible()

    await expect(page.getByText('目的地', { exact: true })).toBeVisible()
    await expect(page.getByText('到着予定 未設定')).toBeVisible()
  })

  test('出発地・目的地を設定すると、名称と予定時刻がタイムラインに表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '設定表示テストバイク',
    })
    const touringPlanId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '設定表示テストプラン'
    )

    await setTouringPlanStartLocation(authToken, myUserBikeId, touringPlanId, {
      latitude: 35.681236,
      longitude: 139.767125,
      name: '出発地点',
    })
    await setTouringPlanDestinationLocation(
      authToken,
      myUserBikeId,
      touringPlanId,
      {
        latitude: 35.170915,
        longitude: 136.881537,
        name: '目的地点',
        travelMinutesFromPrev: 120,
      }
    )

    await page.goto(
      `/app/my-bike/${myUserBikeId}/touring-plans/${touringPlanId}`
    )

    await expect(page.getByText('出発地点')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('出発予定 出発時')).toBeVisible()

    await expect(page.getByText('目的地点')).toBeVisible()
    await expect(page.getByText('到着予定 出発から2時間後')).toBeVisible()
  })

  test('経由地スポットを追加すると、タイムラインに予定時刻とともに表示され編集モーダルから削除できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '経由地表示テストバイク',
    })
    const touringPlanId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '経由地表示テストプラン'
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

    await page.goto(
      `/app/my-bike/${myUserBikeId}/touring-plans/${touringPlanId}`
    )

    await expect(page.getByText('経由スポット')).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText('到着予定 出発から1時間後')).toBeVisible()
    await expect(page.getByText('出発予定 出発から1時間30分後')).toBeVisible()

    // 編集ボタンは出現順に [プラン編集, 出発地, 経由スポット, 目的地] の4つ
    await page.getByRole('button', { name: '編集' }).nth(2).click()
    await expect(
      page.getByRole('heading', { name: 'スポットを編集' })
    ).toBeVisible({ timeout: 5_000 })

    await page.getByRole('button', { name: '削除する' }).click()
    await expect(
      page.getByText('このスポットを削除しますか？この操作は取り消せません。')
    ).toBeVisible({ timeout: 5_000 })
    await page.getByRole('button', { name: '削除', exact: true }).click()

    await expect(page.getByText('経由スポット')).not.toBeVisible({
      timeout: 10_000,
    })
  })
})
