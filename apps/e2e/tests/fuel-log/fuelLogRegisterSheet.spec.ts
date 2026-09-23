import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { registerTestFuelLog } from '../../helpers/fuelLogHelper'
import { FuelLogRegisterSheetPage } from '../../pages/fuelLogRegisterSheetPage'

test.describe('給油シート - 登録フロー(#575 P1)', () => {
  test('ODO・給油量・支払金額の3項目を入力するだけで給油を記録でき、ライブ計器と燃費が正しく反映される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '給油シート登録テスト',
      totalMileage: 12750,
    })

    // 前回の満タン給油（区間距離・燃費のライブ計器の基準になる）
    await registerTestFuelLog(authToken, myUserBikeId, {
      refueledAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      mileage: 12750,
      previousMileage: 12500,
      amount: 10,
      totalPrice: 1500,
    })

    const sheet = new FuelLogRegisterSheetPage(page)
    await sheet.goto(myUserBikeId)

    // ODOの初期値は空（総走行距離が入っていない）
    await expect(sheet.mileageInput).toHaveValue('')
    // 満タンが既定で選択されている
    await expect(sheet.fullTankChip).toHaveAttribute('aria-pressed', 'true')

    await sheet.fillMainFields({
      mileage: 13010,
      amount: 11.8,
      totalPrice: 2065,
    })

    // ライブ計器: 区間260km・燃費22.0km/L・単価175円/L
    await expect(sheet.liveGauge).toContainText('260')
    await expect(sheet.liveGauge).toContainText('22.0')
    await expect(sheet.liveGauge).toContainText('175')

    await sheet.submit()

    await expect(page.getByText('給油を記録しました')).toBeVisible({
      timeout: 10_000,
    })
    await expect(sheet.sheet).not.toBeVisible()

    // 保存後、一覧に燃費付きで反映されている（リロードしてサーバーの確定値を確認する）。
    // Playwrightの既定ビューポート（1280x720）はPC幅のため台帳（`fuel-ledger-section`）
    // が表示される。モバイル用カードは `display:none` でDOM上に残るだけで
    // 同じ文言を含みうる（`display:none` は `getByRole` の除外対象にならない）ため、
    // 台帳側に明示的にスコープする。
    const registeredCard = page
      .getByTestId('fuel-ledger-section')
      .getByRole('button', { name: /13,010km/ })
    await expect(registeredCard).toBeVisible({ timeout: 10_000 })
    await expect(registeredCard).toContainText('22.0')
  })
})
