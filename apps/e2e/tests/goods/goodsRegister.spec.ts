import { expect, test } from '../../fixtures/authenticatedPage'
import { findTestGoodsModel } from '../../helpers/goodsHelper'
import { GoodsCatalogPage } from '../../pages/goodsCatalogPage'
import { GoodsPage } from '../../pages/goodsPage'

/**
 * グッズ登録フロー E2E テスト
 *
 * @remarks
 * カタログ検索→購入情報入力モーダル→一覧反映までの一連の流れを確認する。
 */
test.describe('グッズ登録フロー', () => {
  test('カタログから型番を選択し購入情報を入力して登録できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const model = await findTestGoodsModel(authToken)

    const catalogPage = new GoodsCatalogPage(page)
    await catalogPage.goto()
    await catalogPage.searchByKeyword(model.modelNumber)

    await expect(catalogPage.registerButton).toHaveCount(1, {
      timeout: 5_000,
    })
    await catalogPage.registerButton.click()

    await expect(
      page.getByRole('heading', { name: '購入情報を入力' })
    ).toBeVisible()

    await page.locator('#price').fill('12000')
    await page.locator('#memo').fill('E2E登録テスト')
    // 「これを登録する」ボタンも部分一致してしまうため exact 指定で区別する
    await page.getByRole('button', { name: '登録する', exact: true }).click()

    await expect(page).toHaveURL(/\/app\/goods$/, { timeout: 15_000 })

    const goodsPage = new GoodsPage(page)
    await expect(
      goodsPage.goodsCard(`${model.manufacturerName} ${model.name}`)
    ).toBeVisible()
  })
})
