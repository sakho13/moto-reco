import { expect, test } from '../../fixtures/authenticatedPage'
import {
  findTestGoodsModel,
  registerTestUserGoods,
} from '../../helpers/goodsHelper'
import { GoodsPage } from '../../pages/goodsPage'

/**
 * グッズ編集・削除 E2E テスト
 *
 * @remarks
 * 給油履歴と同様、カードタップで編集モーダルが開き、モーダル内から削除もできる。
 */
test.describe('グッズ編集・削除', () => {
  test('カードをタップすると編集モーダルが開き、購入情報を更新できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const model = await findTestGoodsModel(authToken)
    await registerTestUserGoods(authToken, {
      goodsModelId: model.goodsModelId,
      memo: '編集前メモ',
    })

    const goodsPage = new GoodsPage(page)
    await goodsPage.goto()

    const cardText = `${model.manufacturerName} ${model.name}`
    const card = goodsPage.goodsCard(cardText).first()
    await expect(card).toBeVisible()
    await card.click()

    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByRole('heading', { name: '購入情報を編集' })
    ).toBeVisible()

    await page.locator('#memo').fill('編集後メモ')
    await dialog.getByRole('button', { name: '更新する' }).click()

    await expect(dialog).not.toBeVisible()
    await expect(goodsPage.section.getByText('編集後メモ')).toBeVisible()
  })

  test('編集モーダルから購入グッズを削除できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const model = await findTestGoodsModel(authToken)
    await registerTestUserGoods(authToken, {
      goodsModelId: model.goodsModelId,
      memo: '削除対象',
    })

    const goodsPage = new GoodsPage(page)
    await goodsPage.goto()

    const cardText = `${model.manufacturerName} ${model.name}`
    const card = goodsPage.goodsCard(cardText).first()
    await expect(card).toBeVisible()
    await card.click()

    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByRole('heading', { name: '購入情報を編集' })
    ).toBeVisible()

    page.once('dialog', (confirmDialog) => confirmDialog.accept())
    await dialog.getByRole('button', { name: '削除する' }).click()

    await expect(goodsPage.emptyMessage).toBeVisible()
  })
})
