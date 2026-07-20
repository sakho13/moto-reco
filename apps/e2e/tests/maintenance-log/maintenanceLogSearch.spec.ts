import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { registerTestMaintenanceLog } from '../../helpers/maintenanceLogHelper'
import { MaintenanceLogListPage } from '../../pages/maintenanceLogListPage'

test.describe('メンテナンス履歴一覧 - キーワード検索', () => {
  test('メモの部分一致で絞り込める', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'メンテナンス検索テスト',
    })
    await registerTestMaintenanceLog(authToken, myUserBikeId, {
      performedAt: new Date().toISOString(),
      mileage: 10100,
      memo: 'E2Eエンジンオイル交換',
    })
    await registerTestMaintenanceLog(authToken, myUserBikeId, {
      performedAt: new Date().toISOString(),
      mileage: 10200,
      memo: 'E2Eチェーン注油',
    })

    const maintenanceLogListPage = new MaintenanceLogListPage(page)
    await maintenanceLogListPage.goto(myUserBikeId)

    await expect(
      maintenanceLogListPage.maintenanceLogCard(/E2Eエンジンオイル交換/)
    ).toBeVisible()
    await expect(
      maintenanceLogListPage.maintenanceLogCard(/E2Eチェーン注油/)
    ).toBeVisible()

    await maintenanceLogListPage.searchByKeyword('注油')

    await expect(
      maintenanceLogListPage.maintenanceLogCard(/E2Eチェーン注油/)
    ).toBeVisible()
    await expect(
      maintenanceLogListPage.maintenanceLogCard(/E2Eエンジンオイル交換/)
    ).not.toBeVisible()
  })

  test('該当するメンテナンス履歴がない場合は空状態メッセージが表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'メンテナンス検索該当なしテスト',
    })
    await registerTestMaintenanceLog(authToken, myUserBikeId, {
      performedAt: new Date().toISOString(),
      mileage: 10100,
      memo: 'E2E検索対象外メンテナンス',
    })

    const maintenanceLogListPage = new MaintenanceLogListPage(page)
    await maintenanceLogListPage.goto(myUserBikeId)
    await maintenanceLogListPage.searchByKeyword('存在しないキーワード')

    await expect(maintenanceLogListPage.noResultMessage).toBeVisible()
  })

  test('クリアボタンで検索条件を解除できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'メンテナンス検索クリアテスト',
    })
    await registerTestMaintenanceLog(authToken, myUserBikeId, {
      performedAt: new Date().toISOString(),
      mileage: 10100,
      memo: 'E2Eクリア確認メンテナンス',
    })

    const maintenanceLogListPage = new MaintenanceLogListPage(page)
    await maintenanceLogListPage.goto(myUserBikeId)
    await maintenanceLogListPage.searchByKeyword('存在しないキーワード')
    await expect(maintenanceLogListPage.noResultMessage).toBeVisible()

    await maintenanceLogListPage.clearSearch()
    await expect(
      maintenanceLogListPage.maintenanceLogCard(/E2Eクリア確認メンテナンス/)
    ).toBeVisible()
  })
})
