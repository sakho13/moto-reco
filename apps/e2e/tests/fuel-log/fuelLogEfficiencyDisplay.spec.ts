import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { registerTestFuelLog } from '../../helpers/fuelLogHelper'
import { FuelLogListPage } from '../../pages/fuelLogListPage'

test.describe('給油履歴一覧 - 燃費null時の表示', () => {
  test('継ぎ足し給油は「継ぎ足し」と表示され、「初回給油」とは区別される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '燃費表示テスト',
    })

    // 1件目: 直前の満タン給油が無いため燃費null（初回給油）
    await registerTestFuelLog(authToken, myUserBikeId, {
      refueledAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      mileage: 10000,
      previousMileage: 9800,
      amount: 10,
      totalPrice: 1500,
      isFullTank: true,
    })

    // 2件目: 継ぎ足し給油のため燃費null（次回に繰越）
    await registerTestFuelLog(authToken, myUserBikeId, {
      refueledAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      mileage: 10050,
      previousMileage: 10000,
      amount: 3,
      totalPrice: 450,
      isFullTank: false,
    })

    // 3件目: 満タン給油。1件目からの区間距離÷(2件目+3件目の給油量)で燃費が算出される
    await registerTestFuelLog(authToken, myUserBikeId, {
      refueledAt: new Date().toISOString(),
      mileage: 10300,
      previousMileage: 10050,
      amount: 10,
      totalPrice: 1600,
      isFullTank: true,
    })

    const fuelLogListPage = new FuelLogListPage(page)
    await fuelLogListPage.goto(myUserBikeId)

    // 初回給油（直前の満タン給油が無い）
    const initialCard = fuelLogListPage.fuelLogCard(/10,000km/)
    await expect(initialCard).toBeVisible()
    await expect(initialCard).toContainText('初回給油')

    // 継ぎ足し給油は「初回給油」ではなく「継ぎ足し」と表示される
    const continuationCard = fuelLogListPage.fuelLogCard(/10,050km/)
    await expect(continuationCard).toBeVisible()
    await expect(continuationCard).toContainText('継ぎ足し')
    await expect(continuationCard).not.toContainText('初回給油')

    // 満タン給油は継ぎ足し分を合算した燃費が算出される: 300km ÷ (3L+10L) = 23.1km/L
    const calculatedCard = fuelLogListPage.fuelLogCard(/10,300km/)
    await expect(calculatedCard).toBeVisible()
    await expect(calculatedCard).toContainText('23.1')
  })
})
