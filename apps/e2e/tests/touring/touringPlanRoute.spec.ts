import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import {
  addTouringPlanSpot,
  registerTestTouringPlan,
  setTouringPlanDestinationLocation,
  setTouringPlanStartLocation,
  startTouringFromPlan,
} from '../../helpers/touringPlanHelper'

test.describe('ツーリングプラン詳細 - 道のり', () => {
  test('出発地・目的地が未設定の場合、決める操作と追加の操作が表示される', async ({
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

    await expect(
      page.getByRole('button', { name: '出発地を決める' })
    ).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByRole('button', { name: '目的地を決める' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: '＋ スポットを追加' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: '＋ 休憩を追加' })
    ).toBeVisible()
  })

  test('出発地・目的地を設定すると、名称と到着予定が道のりに表示される', async ({
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
    await expect(page.getByText('目的地点')).toBeVisible()
    await expect(page.getByText('出発から2時間後に到着')).toBeVisible()
    await expect(page.getByText('出発から到着まで')).toBeVisible()
  })

  test('経由地スポットを追加すると、道のりに予定時刻とともに表示され編集モーダルから削除できる', async ({
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
    await expect(page.getByText('出発から1時間後 〜 1時間30分後')).toBeVisible()

    await page.getByRole('button', { name: '経由スポットを編集' }).click()
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

  test('移動時間が未入力の区間から、到着側の地点の編集を開いて入力できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '移動時間入力テストバイク',
    })
    const touringPlanId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '移動時間入力テストプラン'
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
    })

    await page.goto(
      `/app/my-bike/${myUserBikeId}/touring-plans/${touringPlanId}`
    )

    await page.getByRole('button', { name: '移動時間を入れる' }).click()
    await expect(
      page.getByRole('heading', { name: 'スポットを編集' })
    ).toBeVisible({ timeout: 5_000 })
    await page.locator('#planSpotTravelMinutesFromPrev').fill('90')
    await page.getByRole('button', { name: '更新する' }).click()

    await expect(page.getByText('出発から1時間30分後に到着')).toBeVisible({
      timeout: 10_000,
    })
    await expect(
      page.getByRole('button', { name: '移動時間を入れる' })
    ).toHaveCount(0)
  })

  test('目的地を編集して保存しても、名前が残る', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '名前保持テストバイク',
    })
    const touringPlanId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '名前保持テストプラン'
    )
    await setTouringPlanDestinationLocation(
      authToken,
      myUserBikeId,
      touringPlanId,
      {
        latitude: 35.170915,
        longitude: 136.881537,
        name: '目的地点',
      }
    )

    await page.goto(
      `/app/my-bike/${myUserBikeId}/touring-plans/${touringPlanId}`
    )

    await page.getByRole('button', { name: '目的地点を編集' }).click()
    await expect(page.locator('#planLocationName')).toHaveValue('目的地点', {
      timeout: 5_000,
    })
    await page.locator('#planLocationTravelMinutesFromPrev').fill('30')
    await page.getByRole('button', { name: '保存する' }).click()

    await expect(page.getByRole('heading', { name: '目的地点' })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText('出発から到着まで')).toBeVisible()
  })

  test('地点が2件以上あるときだけ順番を変える操作が出る', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '並び替え表示テストバイク',
    })
    const touringPlanId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '並び替え表示テストプラン'
    )
    await addTouringPlanSpot(authToken, myUserBikeId, touringPlanId, {
      type: 'SPOT',
      name: '1つ目の地点',
    })

    const planUrl = `/app/my-bike/${myUserBikeId}/touring-plans/${touringPlanId}`
    await page.goto(planUrl)
    await expect(page.getByText('1つ目の地点')).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByRole('button', { name: '順番を変える' })
    ).toHaveCount(0)

    await addTouringPlanSpot(authToken, myUserBikeId, touringPlanId, {
      type: 'BREAK',
      name: '2つ目の地点',
    })
    await page.goto(planUrl)
    await page.getByRole('button', { name: '順番を変える' }).click()

    await expect(
      page.getByRole('button', { name: 'ドラッグして並び替え' })
    ).toHaveCount(2, { timeout: 5_000 })
    await page.getByRole('button', { name: '並び替えを終える' }).click()
    await expect(page.getByText('1つ目の地点')).toBeVisible()
  })

  test('走行記録のリンクは履歴を積まず、記録を開いて戻るとプラン詳細に戻れる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '戻る確認テストバイク',
    })
    const touringPlanId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      '戻る確認テストプラン'
    )
    await startTouringFromPlan(authToken, myUserBikeId, touringPlanId)

    await page.goto(
      `/app/my-bike/${myUserBikeId}/touring-plans/${touringPlanId}`
    )

    await page.getByRole('button', { name: /このプランの走行記録 1件/ }).click()
    await page.getByRole('button', { name: /戻る確認テストプラン/ }).click()
    await expect(page).toHaveURL(/\/tourings\/[^/]+$/, { timeout: 10_000 })

    await page.goBack()

    await expect(
      page.getByRole('button', { name: 'プランを編集' })
    ).toBeVisible({ timeout: 10_000 })
  })

  test('ピンのツールチップは地点名をHTMLとして解釈しない', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'ツールチップテストバイク',
    })
    const touringPlanId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      'ツールチップテストプラン'
    )
    const name = '<img src=x onerror="window.__tooltipXss=1">'
    await addTouringPlanSpot(authToken, myUserBikeId, touringPlanId, {
      type: 'SPOT',
      name,
      latitude: 35.5,
      longitude: 138.5,
    })

    await page.goto(
      `/app/my-bike/${myUserBikeId}/touring-plans/${touringPlanId}`
    )

    await page
      .locator('.leaflet-marker-icon')
      .first()
      .hover({ timeout: 15_000 })

    const tooltip = page.locator('.leaflet-tooltip')
    await expect(tooltip).toHaveText(name, { timeout: 5_000 })
    await expect(tooltip.locator('img')).toHaveCount(0)
    expect(
      await page.evaluate(
        () => (window as unknown as { __tooltipXss?: number }).__tooltipXss
      )
    ).toBeUndefined()
  })

  test('順番を変えるモードで、キーボードで地点を入れ替えられる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'キーボード並び替えテストバイク',
    })
    const touringPlanId = await registerTestTouringPlan(
      authToken,
      myUserBikeId,
      'キーボード並び替えテストプラン'
    )
    for (const name of ['1番目の地点', '2番目の地点']) {
      await addTouringPlanSpot(authToken, myUserBikeId, touringPlanId, {
        type: 'SPOT',
        name,
      })
    }

    await page.goto(
      `/app/my-bike/${myUserBikeId}/touring-plans/${touringPlanId}`
    )
    await page.getByRole('button', { name: '順番を変える' }).click()

    const handle = page
      .getByRole('button', { name: 'ドラッグして並び替え' })
      .first()
    await handle.focus()
    await page.keyboard.press('Space')
    await expect(page.getByText('1番目の地点を持ち上げました')).toBeAttached()
    await page.keyboard.press('ArrowDown')
    await expect(
      page.getByText('1番目の地点を2番目へ移動します')
    ).toBeAttached()
    await page.keyboard.press('Space')
    await expect(
      page.getByText('1番目の地点を2番目に置きました')
    ).toBeAttached()

    await page.getByRole('button', { name: '並び替えを終える' }).click()

    const first = page.locator('[data-node-id] h3', { hasText: '番目の地点' })
    await expect(first.first()).toHaveText('2番目の地点', { timeout: 10_000 })
  })
})
