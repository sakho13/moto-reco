import { registerTestBike } from '../helpers/bikeHelper'
import { registerTestSpot, updateTestSpot } from '../helpers/spotHelper'
import { registerTestTouring } from '../helpers/touringHelper'
import { TouringDetailPage } from '../pages/touringDetailPage'
import { test, expect } from './demoFixtures'
import { recordScene } from './recording'
import { pause, prepareStage, smoothScrollToCenter } from './stage'

const at = (time: string): string => `2026-10-18T${time}:00+09:00`

/** 伊豆半島を一周した日のツーリングを作る */
async function registerIzuTouring(authToken: string) {
  const bikeId = await registerTestBike(authToken, {
    nickname: 'わたしのカブ',
    displacement: 125,
    totalMileage: 12323,
  })
  const touringId = await registerTestTouring(authToken, bikeId, {
    title: '秋の伊豆半島ぐるり一周',
    startDate: at('06:40'),
    endDate: at('18:20'),
    startMileage: 12000,
    endMileage: 12323,
    start: { latitude: 35.3192, longitude: 139.5467 },
    end: { latitude: 35.0956, longitude: 138.8634 },
  })
  const spot = (params: Parameters<typeof registerTestSpot>[3]) =>
    registerTestSpot(authToken, bikeId, touringId, params)

  await spot({
    type: 'SPOT',
    name: '道の駅 伊東マリンタウン',
    memo: '朝市で干物を買った。潮の匂いがする。',
    latitude: 34.9739,
    longitude: 139.1006,
    arrivedAt: at('08:30'),
    departedAt: at('09:05'),
  })
  await spot({
    type: 'BREAK',
    name: '城ヶ崎の自販機前',
    latitude: 34.8953,
    longitude: 139.1356,
    arrivedAt: at('09:50'),
    departedAt: at('10:05'),
  })
  await spot({
    type: 'SPOT',
    name: '石廊崎',
    memo: '岬の先端まで歩いた。風が強くて帽子が飛びかけた。ここが今日の折り返し。',
    latitude: 34.6019,
    longitude: 138.8456,
    arrivedAt: at('12:10'),
    departedAt: at('13:00'),
  })
  const skippedId = await spot({
    type: 'SPOT',
    name: '堂ヶ島 天窓洞',
    latitude: 34.7778,
    longitude: 138.7639,
  })
  await updateTestSpot(authToken, bikeId, touringId, skippedId, {
    isSkipped: true,
    arrivedAt: null,
  })
  await spot({
    type: 'SPOT',
    name: '黄金崎',
    memo: '夕方の光で崖が金色になっていた。',
    latitude: 34.8573,
    longitude: 138.7634,
    arrivedAt: at('14:40'),
    departedAt: at('15:05'),
  })
  await spot({
    type: 'BREAK',
    name: '戸田峠の休憩所',
    latitude: 34.9618,
    longitude: 138.8322,
    arrivedAt: at('16:00'),
    departedAt: at('16:15'),
  })

  return { bikeId, touringId }
}

test('ツーリング詳細の飛び石', async ({
  demoPage: page,
  authToken,
}, testInfo) => {
  const { bikeId, touringId } = await registerIzuTouring(authToken)
  const detailPage = new TouringDetailPage(page)
  const row = (name: string) =>
    page.locator('[data-node-id]').filter({ hasText: name })

  await prepareStage(page)
  await detailPage.goto(bikeId, touringId)
  await expect(row('石廊崎')).toBeVisible({ timeout: 30_000 })

  // 録画中に地図のタイルを待たないよう、先に一度開いて読み込んでおく
  await detailPage.openMapButton.tap()
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible({
    timeout: 30_000,
  })
  await pause(page, 1500)
  await detailPage.closeMapButton.tap()
  await expect(detailPage.mapPanel).toHaveCount(0)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await pause(page, 800)

  await recordScene(page, testInfo, 'touring-journey', async (controls) => {
    await pause(page, 1600)
    await smoothScrollToCenter(row('石廊崎'), 3400)
    await pause(page, 700)
    await controls.capturePoster()
    await pause(page, 900)

    await row('石廊崎').getByRole('button', { name: '地図', exact: true }).tap()
    await expect(detailPage.mapPanel).toBeVisible()
    await pause(page, 3000)
    await detailPage.closeMapButton.tap()
    await expect(detailPage.mapPanel).toHaveCount(0)
    await pause(page, 700)

    await smoothScrollToCenter(row('終着地'), 2600)
    await pause(page, 1600)
  })
})
