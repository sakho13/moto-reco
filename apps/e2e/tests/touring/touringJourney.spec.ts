import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { registerTestSpot, updateTestSpot } from '../../helpers/spotHelper'
import { registerTestTouring } from '../../helpers/touringHelper'
import { TouringDetailPage } from '../../pages/touringDetailPage'
import { TouringListPage } from '../../pages/touringListPage'

const MOBILE_VIEWPORT = { width: 390, height: 844 }

/** 座標ありのスポット2件とスキップ1件を持つ完了済みツーリングを作る */
async function registerJourneyTouring(authToken: string) {
  const myUserBikeId = await registerTestBike(authToken, {
    nickname: '飛び石テスト',
  })
  const touringId = await registerTestTouring(authToken, myUserBikeId, {
    title: '飛び石テストツーリング',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
  })
  await registerTestSpot(authToken, myUserBikeId, touringId, {
    name: '最初の地点',
    latitude: 35.1,
    longitude: 139.1,
  })
  const skippedSpotId = await registerTestSpot(
    authToken,
    myUserBikeId,
    touringId,
    { name: '寄らなかった地点', latitude: 35.2, longitude: 139.2 }
  )
  await updateTestSpot(authToken, myUserBikeId, touringId, skippedSpotId, {
    isSkipped: true,
    arrivedAt: null,
  })
  await registerTestSpot(authToken, myUserBikeId, touringId, {
    name: '最後の地点',
    latitude: 35.3,
    longitude: 139.3,
  })
  return { myUserBikeId, touringId }
}

test.describe('ツーリング詳細 - 閲覧モードと編集モード', () => {
  test('編集の操作は編集モードでだけ表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const { myUserBikeId, touringId } = await registerJourneyTouring(authToken)
    const detailPage = new TouringDetailPage(page)
    await detailPage.goto(myUserBikeId, touringId)

    await expect(page.getByText('最初の地点')).toBeVisible({ timeout: 10_000 })
    await expect(detailPage.dragHandles).toHaveCount(0)

    await detailPage.editButton.click()
    await expect(detailPage.dragHandles).toHaveCount(3)
    await expect(page.getByRole('button', { name: '休憩を追加' })).toBeVisible()

    await detailPage.finishEditButton.click()
    await expect(detailPage.dragHandles).toHaveCount(0)
    await expect(detailPage.editButton).toBeVisible()
  })

  test('スキップした地点は番号を持たず「不在」の石で表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const { myUserBikeId, touringId } = await registerJourneyTouring(authToken)
    const detailPage = new TouringDetailPage(page)
    await detailPage.goto(myUserBikeId, touringId)

    await expect(page.getByText('不在', { exact: true })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText('3', { exact: true })).toHaveCount(0)
  })
})

test.describe('ツーリング詳細 - 地図', () => {
  test('PC幅では地図を常に表示し、スキップを含む全地点にピンを立てる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const { myUserBikeId, touringId } = await registerJourneyTouring(authToken)
    const detailPage = new TouringDetailPage(page)
    await detailPage.goto(myUserBikeId, touringId)

    await expect(detailPage.mapPins).toHaveCount(3, { timeout: 15_000 })
    await expect(detailPage.openMapButton).toHaveCount(0)
  })

  test('モバイル幅では地図を全画面で開き、ボタンとブラウザの戻るで詳細へ戻る', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const { myUserBikeId, touringId } = await registerJourneyTouring(authToken)
    await page.setViewportSize(MOBILE_VIEWPORT)
    const detailPage = new TouringDetailPage(page)
    await detailPage.goto(myUserBikeId, touringId)

    await expect(page.getByText('最初の地点')).toBeVisible({ timeout: 10_000 })
    await expect(detailPage.mapPins).toHaveCount(0)

    await detailPage.openMapButton.click()
    await expect(detailPage.mapPanel).toBeVisible()
    await expect(detailPage.mapPins).toHaveCount(3, { timeout: 15_000 })

    await detailPage.closeMapButton.click()
    await expect(detailPage.mapPanel).toHaveCount(0)
    await expect(page).toHaveURL(new RegExp(`/tourings/${touringId}$`))

    await detailPage.openMapButton.click()
    await expect(detailPage.mapPanel).toBeVisible()
    await page.goBack()
    await expect(detailPage.mapPanel).toHaveCount(0)
    await expect(page).toHaveURL(new RegExp(`/tourings/${touringId}$`))
  })

  test('座標が1件もないツーリングは地図を出さない', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '地図なしテスト',
    })
    const touringId = await registerTestTouring(authToken, myUserBikeId, {
      title: '地図なしツーリング',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    })
    await page.setViewportSize(MOBILE_VIEWPORT)
    const detailPage = new TouringDetailPage(page)
    await detailPage.goto(myUserBikeId, touringId)

    await expect(page.getByText('地図なしツーリング')).toBeVisible({
      timeout: 10_000,
    })
    await expect(detailPage.openMapButton).toHaveCount(0)
  })
})

test.describe('ツーリング一覧 - 月ごとのまとめ', () => {
  test('日付の並びでは月見出しを出し、距離の並びでは出さない', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: '月見出しテスト',
    })
    await registerTestTouring(authToken, myUserBikeId, {
      title: '十月のツーリング',
      startDate: '2026-10-18T01:00:00.000Z',
      endDate: '2026-10-18T09:00:00.000Z',
    })
    await registerTestTouring(authToken, myUserBikeId, {
      title: '九月のツーリング',
      startDate: '2026-09-12T01:00:00.000Z',
      endDate: '2026-09-12T09:00:00.000Z',
    })

    const listPage = new TouringListPage(page)
    await listPage.goto(myUserBikeId)

    const octoberHeading = listPage.ledgerSection.getByRole('heading', {
      name: '2026年10月',
    })
    await expect(octoberHeading).toBeVisible({ timeout: 10_000 })
    await expect(
      listPage.ledgerSection.getByRole('heading', { name: '2026年9月' })
    ).toBeVisible()

    await listPage.sortByDistanceButton.click()
    await expect(octoberHeading).toHaveCount(0)
    await expect(listPage.touringCard(/十月のツーリング/)).toBeVisible()
  })
})
