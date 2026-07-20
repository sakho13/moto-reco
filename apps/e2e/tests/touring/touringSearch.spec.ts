import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { registerTestTouring } from '../../helpers/touringHelper'
import { TouringListPage } from '../../pages/touringListPage'

test.describe('ツーリング一覧 - キーワード検索', () => {
  test('タイトルの部分一致で絞り込める', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'ツーリング検索テスト',
    })
    await registerTestTouring(authToken, myUserBikeId, {
      title: 'E2E房総半島ツーリング',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    })
    await registerTestTouring(authToken, myUserBikeId, {
      title: 'E2E富士山周辺ドライブ',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    })

    const touringListPage = new TouringListPage(page)
    await touringListPage.goto(myUserBikeId)

    await expect(
      touringListPage.touringCard(/E2E房総半島ツーリング/)
    ).toBeVisible()
    await expect(
      touringListPage.touringCard(/E2E富士山周辺ドライブ/)
    ).toBeVisible()

    await touringListPage.searchByKeyword('房総')

    await expect(
      touringListPage.touringCard(/E2E房総半島ツーリング/)
    ).toBeVisible()
    await expect(
      touringListPage.touringCard(/E2E富士山周辺ドライブ/)
    ).not.toBeVisible()
  })

  test('該当するツーリングがない場合は空状態メッセージが表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'ツーリング検索該当なしテスト',
    })
    await registerTestTouring(authToken, myUserBikeId, {
      title: 'E2E検索対象外ツーリング',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    })

    const touringListPage = new TouringListPage(page)
    await touringListPage.goto(myUserBikeId)
    await touringListPage.searchByKeyword('存在しないキーワード')

    await expect(touringListPage.noResultMessage).toBeVisible()
  })

  test('クリアボタンで検索条件を解除できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'ツーリング検索クリアテスト',
    })
    await registerTestTouring(authToken, myUserBikeId, {
      title: 'E2Eクリア確認ツーリング',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    })

    const touringListPage = new TouringListPage(page)
    await touringListPage.goto(myUserBikeId)
    await touringListPage.searchByKeyword('存在しないキーワード')
    await expect(touringListPage.noResultMessage).toBeVisible()

    await touringListPage.clearSearch()
    await expect(
      touringListPage.touringCard(/E2Eクリア確認ツーリング/)
    ).toBeVisible()
  })
})
