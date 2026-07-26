import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import {
  findTestGoodsModel,
  registerTestUserGoods,
} from '../../helpers/goodsHelper'

/**
 * マイバイク詳細ページ「取り付けアクセサリ」セクション E2E テスト
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

    await page.goto(`/app/my-bike/${myUserBikeId}`)

    const section = page.getByTestId('attached-goods-section')
    await expect(
      section.getByText(`${model.manufacturerName} ${model.name}`)
    ).toBeVisible()
  })

  test('グッズを紐付けていない場合は空状態メッセージが表示される', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      nickname: 'グッズ未紐付けテスト',
    })

    await page.goto(`/app/my-bike/${myUserBikeId}`)

    const section = page.getByTestId('attached-goods-section')
    await expect(
      section.getByText('取り付けアクセサリがまだ登録されていません')
    ).toBeVisible()
  })
})
