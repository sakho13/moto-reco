import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { registerTestFuelLog } from '../../helpers/fuelLogHelper'
import {
  endTestTouring,
  registerTestTouring,
  startTestTouring,
} from '../../helpers/touringHelper'
import { TouringDetailPage } from '../../pages/touringDetailPage'

test.describe('ツーリング詳細 - 給油履歴の手動紐づけ', () => {
  test('ツーリング終了後に追加した給油履歴を紐づけモーダルから検索して手動で紐づけられる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '給油紐づけ登録テスト',
    })
    const touringId = await startTestTouring(
      authToken,
      myUserBikeId,
      '給油紐づけ登録テストツーリング'
    )
    await endTestTouring(authToken, myUserBikeId, touringId)

    // ツーリング終了後に追加した未紐づけの給油履歴（ツーリング期間内の日時）
    const refueledAt = new Date().toISOString()
    await registerTestFuelLog(authToken, myUserBikeId, {
      refueledAt,
      mileage: 10100,
      previousMileage: 10000,
      memo: 'E2E未紐づけ給油',
    })

    const touringDetailPage = new TouringDetailPage(page)
    await touringDetailPage.goto(myUserBikeId, touringId)
    await touringDetailPage.openFuelLogLinkModal()

    const fuelLogCheckbox = touringDetailPage.fuelLogCheckbox(/E2E未紐づけ給油/)
    await expect(fuelLogCheckbox).toBeVisible({ timeout: 10_000 })
    await expect(fuelLogCheckbox).not.toBeChecked()

    await fuelLogCheckbox.check()
    await touringDetailPage.submitFuelLogLink()
    await touringDetailPage.linkButton.waitFor({
      state: 'hidden',
      timeout: 15_000,
    })

    // 再度紐づけモーダルを開き、紐づけが保存されていることを確認する
    await touringDetailPage.openFuelLogLinkModal()
    const reopenedCheckbox =
      touringDetailPage.fuelLogCheckbox(/E2E未紐づけ給油/)
    await expect(reopenedCheckbox).toBeVisible({ timeout: 10_000 })
    await expect(reopenedCheckbox).toBeChecked()
  })

  test('紐づけ済みの給油履歴を紐づけモーダルからチェックを外して解除できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '給油紐づけ解除テスト',
    })
    const touringId = await startTestTouring(
      authToken,
      myUserBikeId,
      '給油紐づけ解除テストツーリング'
    )
    await endTestTouring(authToken, myUserBikeId, touringId)

    // 既にこのツーリングに紐づいた状態で給油履歴を登録する
    const refueledAt = new Date().toISOString()
    await registerTestFuelLog(authToken, myUserBikeId, {
      refueledAt,
      mileage: 10100,
      previousMileage: 10000,
      memo: 'E2E解除対象給油',
      touringId,
    })

    const touringDetailPage = new TouringDetailPage(page)
    await touringDetailPage.goto(myUserBikeId, touringId)
    await touringDetailPage.openFuelLogLinkModal()

    const fuelLogCheckbox = touringDetailPage.fuelLogCheckbox(/E2E解除対象給油/)
    await expect(fuelLogCheckbox).toBeVisible({ timeout: 10_000 })
    await expect(fuelLogCheckbox).toBeChecked()

    await fuelLogCheckbox.uncheck()
    await touringDetailPage.submitFuelLogLink()
    await touringDetailPage.linkButton.waitFor({
      state: 'hidden',
      timeout: 15_000,
    })

    // 再度紐づけモーダルを開き、紐づけが解除されていることを確認する
    await touringDetailPage.openFuelLogLinkModal()
    const reopenedCheckbox =
      touringDetailPage.fuelLogCheckbox(/E2E解除対象給油/)
    await expect(reopenedCheckbox).toBeVisible({ timeout: 10_000 })
    await expect(reopenedCheckbox).not.toBeChecked()
  })

  test('「期間内のみ表示」を解除すると期間外の給油履歴を検索して紐づけられる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '給油紐づけ全件表示テスト',
    })

    // 10日前に完了した過去のツーリング（デフォルトの期間フィルタの範囲外）
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const touringStart = new Date(tenDaysAgo.getTime())
    const touringEnd = new Date(tenDaysAgo.getTime() + 60 * 60 * 1000)
    const touringId = await registerTestTouring(authToken, myUserBikeId, {
      title: '給油紐づけ全件表示テストツーリング',
      startDate: touringStart.toISOString(),
      endDate: touringEnd.toISOString(),
    })

    // 現在日時（ツーリング期間から大きく外れた）給油履歴を未紐づけで登録する
    const refueledAt = new Date().toISOString()
    await registerTestFuelLog(authToken, myUserBikeId, {
      refueledAt,
      mileage: 10100,
      previousMileage: 10000,
      memo: 'E2E期間外給油',
    })

    const touringDetailPage = new TouringDetailPage(page)
    await touringDetailPage.goto(myUserBikeId, touringId)
    await touringDetailPage.openFuelLogLinkModal()

    // デフォルト（期間内のみ表示=ON）では期間外の給油履歴は表示されない
    const fuelLogCheckbox = touringDetailPage.fuelLogCheckbox(/E2E期間外給油/)
    await expect(touringDetailPage.periodOnlyToggle).toBeChecked()
    await expect(fuelLogCheckbox).not.toBeVisible()

    // 「期間内のみ表示」を解除すると全件検索され、期間外の給油履歴も表示される
    await touringDetailPage.periodOnlyToggle.uncheck()
    await expect(fuelLogCheckbox).toBeVisible({ timeout: 10_000 })

    await fuelLogCheckbox.check()
    await touringDetailPage.submitFuelLogLink()
    await touringDetailPage.linkButton.waitFor({
      state: 'hidden',
      timeout: 15_000,
    })

    // 再度紐づけモーダルを開き、「期間内のみ表示」を解除した状態で紐づけが保存されていることを確認する
    await touringDetailPage.openFuelLogLinkModal()
    await touringDetailPage.periodOnlyToggle.uncheck()
    const reopenedCheckbox = touringDetailPage.fuelLogCheckbox(/E2E期間外給油/)
    await expect(reopenedCheckbox).toBeVisible({ timeout: 10_000 })
    await expect(reopenedCheckbox).toBeChecked()
  })
})
