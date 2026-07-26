import { expect, test } from '../../fixtures/authenticatedPage'
import {
  findTestGoodsModel,
  listTestGoodsManufacturers,
} from '../../helpers/goodsHelper'
import { GoodsCatalogPage } from '../../pages/goodsCatalogPage'

/**
 * グッズカタログ検索 E2E テスト
 *
 * @remarks
 * シードデータの具体的な商品名はハードコードせず、API経由で
 * 実際に存在するメーカー・カテゴリ・型番を取得してからUIの検証に使う。
 */
test.describe('グッズカタログ検索', () => {
  test('メーカーで絞り込むと該当する型番のカードが表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    // 型番から紐づくメーカーIDを取得する（このメーカーには型番が1件以上存在する）
    const model = await findTestGoodsModel(authToken)
    const manufacturers = await listTestGoodsManufacturers(authToken)
    const manufacturer = manufacturers.find(
      (m) => m.goodsManufacturerId === model.goodsManufacturerId
    )
    if (!manufacturer) {
      throw new Error('型番に紐づくメーカーがメーカー一覧に見つかりません')
    }

    // メーカー名+型番（GoodsCatalogItemのmeta表示形式）で一意に特定する。
    // modelNumber単体だと商品名(name)とも部分一致してしまう場合があるため。
    const metaText = `${model.manufacturerName} / ${model.modelNumber}`

    const catalogPage = new GoodsCatalogPage(page)
    await catalogPage.goto()
    await catalogPage.filterByManufacturer(manufacturer.goodsManufacturerId)

    await expect(catalogPage.catalogItem(metaText)).toBeVisible()
  })

  test('カテゴリで絞り込むと該当する型番のカードが表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const model = await findTestGoodsModel(authToken)
    const metaText = `${model.manufacturerName} / ${model.modelNumber}`

    const catalogPage = new GoodsCatalogPage(page)
    await catalogPage.goto()
    await catalogPage.filterByCategory(model.category)

    await expect(catalogPage.catalogItem(metaText)).toBeVisible()
  })

  test('キーワード検索で型番により該当するカードのみ表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const model = await findTestGoodsModel(authToken)
    const metaText = `${model.manufacturerName} / ${model.modelNumber}`

    const catalogPage = new GoodsCatalogPage(page)
    await catalogPage.goto()
    await catalogPage.searchByKeyword(model.modelNumber)

    // キーワード入力はデバウンス(300ms)後に確定するため、表示までポーリングで待つ
    await expect(catalogPage.catalogItem(metaText)).toBeVisible({
      timeout: 5_000,
    })
    await expect(catalogPage.registerButton).toHaveCount(1)
  })
})
