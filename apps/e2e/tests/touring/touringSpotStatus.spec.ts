import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { registerTestSpot, updateTestSpot } from '../../helpers/spotHelper'
import { startTestTouring } from '../../helpers/touringHelper'
import {
  registerTestTouringPlan,
  startTouringFromPlan,
} from '../../helpers/touringPlanHelper'

test.describe('ツーリング詳細 - スポットのスキップ表示', () => {
  test('スキップしたスポットは「スキップ」バッジとスキップ時刻で区別表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'スキップ表示テスト',
    })
    const touringId = await startTestTouring(
      authToken,
      myUserBikeId,
      'スキップ表示テストツーリング'
    )
    const spotId = await registerTestSpot(authToken, myUserBikeId, touringId, {
      name: 'スキップ対象',
    })
    await updateTestSpot(authToken, myUserBikeId, touringId, spotId, {
      isSkipped: true,
      arrivedAt: null,
    })

    await page.goto(`/app/my-bike/${myUserBikeId}/tourings/${touringId}`)

    await expect(page.getByText('スキップ対象')).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText('スキップ', { exact: true })).toBeVisible()
    await expect(page.getByText(/スキップ \d{2}:\d{2}/)).toBeVisible()
  })
})

test.describe('ツーリング詳細 - STARTED状態での終着地表示', () => {
  test('目的地ありプランから開始したツーリングはSTARTED状態でも終着地が表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '終着地表示テスト',
    })
    const touringPlanId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '終着地表示テストプラン',
      {
        destinationLocation: {
          latitude: 35.6809591,
          longitude: 139.7673068,
          name: '東京駅',
        },
      }
    )
    const touringId = await startTouringFromPlan(
      authToken,
      myUserBikeId,
      touringPlanId
    )

    await page.goto(`/app/my-bike/${myUserBikeId}/tourings/${touringId}`)

    // STARTED状態（「進行中」バッジ）であることを確認
    await expect(page.getByText('進行中', { exact: true })).toBeVisible({
      timeout: 10_000,
    })

    // 終着地行が表示される（修正前はCOMPLETED時のみ表示）
    await expect(page.getByText('終着地', { exact: true })).toBeVisible({
      timeout: 10_000,
    })
  })
})
