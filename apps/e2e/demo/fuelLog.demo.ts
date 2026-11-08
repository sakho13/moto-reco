import { registerTestBike } from '../helpers/bikeHelper'
import { registerTestFuelLog } from '../helpers/fuelLogHelper'
import { FuelLogRegisterSheetPage } from '../pages/fuelLogRegisterSheetPage'
import { test, expect } from './demoFixtures'
import { recordScene } from './recording'
import { pause, prepareStage, tapKeypad } from './stage'

/** 今日から数えて `days` 日前の `hour` 時の日時 */
const daysAgo = (days: number, hour: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, 20, 0, 0)
  return date.toISOString()
}

/** 125cc のバイクと、これまでの給油3回分を作る */
async function registerFuelHistory(authToken: string): Promise<void> {
  const bikeId = await registerTestBike(authToken, {
    nickname: 'わたしのカブ',
    displacement: 125,
    totalMileage: 12750,
  })
  const history = [
    {
      days: 27,
      hour: 8,
      mileage: 12215,
      previous: 11950,
      amount: 4.8,
      price: 830,
    },
    {
      days: 16,
      hour: 18,
      mileage: 12482,
      previous: 12215,
      amount: 4.7,
      price: 818,
    },
    {
      days: 6,
      hour: 9,
      mileage: 12750,
      previous: 12482,
      amount: 4.9,
      price: 853,
    },
  ]
  for (const log of history) {
    await registerTestFuelLog(authToken, bikeId, {
      refueledAt: daysAgo(log.days, log.hour),
      mileage: log.mileage,
      previousMileage: log.previous,
      amount: log.amount,
      totalPrice: log.price,
    })
  }
}

test('給油の記録', async ({ demoPage: page, authToken }, testInfo) => {
  await registerFuelHistory(authToken)
  const sheet = new FuelLogRegisterSheetPage(page)
  const recordButton = page
    .getByRole('navigation', { name: 'モバイルナビゲーション' })
    .getByRole('button', { name: '記録' })
  const keypad = page.getByRole('group', { name: '数値入力テンキー' })
  const tapAdvance = (label: string) =>
    keypad.getByRole('button', { name: label, exact: true }).tap()

  await prepareStage(page)
  await page.goto('/app/home')
  await expect(page.getByText('わたしのカブ').first()).toBeVisible({
    timeout: 30_000,
  })
  await pause(page, 1500)

  await recordScene(page, testInfo, 'fuel-log', async (controls) => {
    await pause(page, 1400)
    await recordButton.tap()
    await expect(sheet.sheet).toBeVisible()
    await pause(page, 900)

    await tapKeypad(keypad, '13010')
    await pause(page, 300)
    await tapAdvance('次へ')
    await pause(page, 400)
    await tapKeypad(keypad, '4.6')
    await pause(page, 300)
    await tapAdvance('次へ')
    await pause(page, 400)
    await tapKeypad(keypad, '805')
    await expect(sheet.liveGauge).toContainText('56.5')
    await pause(page, 900)
    await controls.capturePoster()
    await pause(page, 700)

    await tapAdvance('記録')
    await expect(page.getByText('給油を記録しました')).toBeVisible({
      timeout: 10_000,
    })
    await expect(sheet.sheet).toBeHidden()
    await pause(page, 2400)
  })
})
