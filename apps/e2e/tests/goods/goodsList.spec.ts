import { expect, test } from '../../fixtures/authenticatedPage'
import {
  findTestGoodsModel,
  registerTestUserGoods,
} from '../../helpers/goodsHelper'
import { GoodsPage } from '../../pages/goodsPage'

/**
 * グッズ一覧ページ E2E テスト
 */
test.describe('グッズ一覧', () => {
  test('登録済みのグッズがカードとして一覧表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const model = await findTestGoodsModel(authToken)
    await registerTestUserGoods(authToken, {
      goodsModelId: model.goodsModelId,
      memo: 'E2E購入グッズ1',
    })
    await registerTestUserGoods(authToken, {
      goodsModelId: model.goodsModelId,
      memo: 'E2E購入グッズ2',
    })

    const goodsPage = new GoodsPage(page)
    await goodsPage.goto()

    const cardText = `${model.manufacturerName} ${model.name}`
    await expect(goodsPage.goodsCard(cardText).first()).toBeVisible()
    await expect(goodsPage.goodsCard(cardText)).toHaveCount(2)
  })

  test('グッズを登録していない場合は空状態メッセージが表示される', async ({
    authenticatedPage: page,
  }) => {
    const goodsPage = new GoodsPage(page)
    await goodsPage.goto()

    await expect(goodsPage.emptyMessage).toBeVisible()
  })
})
