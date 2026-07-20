import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { registerTestFuelLog } from '../../helpers/fuelLogHelper'
import { FuelLogListPage } from '../../pages/fuelLogListPage'

test.describe('給油履歴一覧 - キーワード検索', () => {
  test('メモの部分一致で絞り込める', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '給油検索テスト',
    })
    await registerTestFuelLog(authToken, myUserBikeId, {
      refueledAt: new Date().toISOString(),
      mileage: 10100,
      previousMileage: 10000,
      memo: 'E2E ENEOSで給油',
    })
    await registerTestFuelLog(authToken, myUserBikeId, {
      refueledAt: new Date().toISOString(),
      mileage: 10200,
      previousMileage: 10100,
      memo: 'E2E 出光で給油',
    })

    const fuelLogListPage = new FuelLogListPage(page)
    await fuelLogListPage.goto(myUserBikeId)

    await expect(fuelLogListPage.fuelLogCard(/E2E ENEOSで給油/)).toBeVisible()
    await expect(fuelLogListPage.fuelLogCard(/E2E 出光で給油/)).toBeVisible()

    await fuelLogListPage.searchByKeyword('ENEOS')

    await expect(fuelLogListPage.fuelLogCard(/E2E ENEOSで給油/)).toBeVisible()
    await expect(
      fuelLogListPage.fuelLogCard(/E2E 出光で給油/)
    ).not.toBeVisible()
  })

  test('該当する給油履歴がない場合は空状態メッセージが表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '給油検索該当なしテスト',
    })
    await registerTestFuelLog(authToken, myUserBikeId, {
      refueledAt: new Date().toISOString(),
      mileage: 10100,
      previousMileage: 10000,
      memo: 'E2E検索対象外給油',
    })

    const fuelLogListPage = new FuelLogListPage(page)
    await fuelLogListPage.goto(myUserBikeId)
    await fuelLogListPage.searchByKeyword('存在しないキーワード')

    await expect(fuelLogListPage.noResultMessage).toBeVisible()
  })

  test('クリアボタンで検索条件を解除できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '給油検索クリアテスト',
    })
    await registerTestFuelLog(authToken, myUserBikeId, {
      refueledAt: new Date().toISOString(),
      mileage: 10100,
      previousMileage: 10000,
      memo: 'E2Eクリア確認給油',
    })

    const fuelLogListPage = new FuelLogListPage(page)
    await fuelLogListPage.goto(myUserBikeId)
    await fuelLogListPage.searchByKeyword('存在しないキーワード')
    await expect(fuelLogListPage.noResultMessage).toBeVisible()

    await fuelLogListPage.clearSearch()
    await expect(fuelLogListPage.fuelLogCard(/E2Eクリア確認給油/)).toBeVisible()
  })
})
