import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { registerTestFuelLog } from '../../helpers/fuelLogHelper'
import { FuelLogRegisterSheetPage } from '../../pages/fuelLogRegisterSheetPage'
import { HomePage } from '../../pages/homePage'

test.describe('ナビゲーション中央の記録ボタン(#575)', () => {
  test('記録ボタンからアクティブ車両の給油シートを開いて記録できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '記録ボタンテスト号',
      totalMileage: 12750,
    })

    // 前回の満タン給油（区間距離・燃費の基準になる）
    await registerTestFuelLog(authToken, myUserBikeId, {
      refueledAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      mileage: 12750,
      previousMileage: 12500,
      amount: 10,
      totalPrice: 1500,
    })

    const homePage = new HomePage(page)
    await homePage.goto()

    // ナビ中央の「記録」ボタンから給油シートを開く（マイバイクの給油履歴画面を経由しない）
    await homePage.recordNavButton.click()

    const sheet = new FuelLogRegisterSheetPage(page)
    await sheet.sheet.waitFor({ state: 'visible' })

    await sheet.fillMainFields({
      mileage: 13010,
      amount: 11.8,
      totalPrice: 2065,
    })
    await sheet.submit()

    await expect(page.getByText('給油を記録しました')).toBeVisible({
      timeout: 10_000,
    })
    await expect(sheet.sheet).not.toBeVisible()

    // ホームの「最近の記録」に燃費付きで反映される（リロードなし）
    await expect(homePage.historySection).toContainText('22.0', {
      timeout: 10_000,
    })
  })
})
