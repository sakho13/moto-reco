import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import {
  findTestGoodsModel,
  registerTestUserGoods,
} from '../../helpers/goodsHelper'
import { AttachedGoodsPage } from '../../pages/attachedGoodsPage'

/**
 * マイバイク詳細「取り付けアクセサリ」ページ E2E テスト
 */
test.describe('マイバイク詳細 - 取り付けアクセサリ', () => {
  test('バイクに紐づけたグッズが取り付けアクセサリセクションに表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'グッズ紐付けテスト',
    })
    const model = await findTestGoodsModel(authToken)
    await registerTestUserGoods(authToken, {
      goodsModelId: model.goodsModelId,
      userMyBikeId: myUserBikeId,
    })

    const attachedGoodsPage = new AttachedGoodsPage(page)
    await attachedGoodsPage.goto(myUserBikeId)

    await expect(
      attachedGoodsPage.goodsCard(`${model.manufacturerName} ${model.name}`)
    ).toBeVisible()
  })

  test('グッズを紐付けていない場合は空状態メッセージが表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'グッズ未紐付けテスト',
    })

    const attachedGoodsPage = new AttachedGoodsPage(page)
    await attachedGoodsPage.goto(myUserBikeId)

    await expect(attachedGoodsPage.emptyMessage).toBeVisible()
  })

  test('「取り付けアクセサリ」カードから専用ページへ遷移する', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'グッズ導線テスト',
    })

    await page.goto(`/app/my-bike/${myUserBikeId}`)

    await page.getByRole('link', { name: /取り付けアクセサリ/ }).click()

    await expect(page).toHaveURL(
      new RegExp(`/app/my-bike/${myUserBikeId}/goods$`)
    )
  })
})
