import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { MyBikePage } from '../../pages/myBikePage'

/**
 * マイバイク一覧ページ E2E テスト
 */
test.describe('マイバイクページ', () => {
  test('バイク未登録の状態で空状態メッセージが表示される', async ({
    authenticatedPage,
  }) => {
    const myBikePage = new MyBikePage(authenticatedPage)
    await myBikePage.goto()

    await expect(myBikePage.emptyMessage).toBeVisible()
    await expect(myBikePage.emptyRegisterButton).toBeVisible()
  })

  test('バイク登録ボタンをクリックするとバイク登録ページへ遷移する', async ({
    authenticatedPage,
  }) => {
    const myBikePage = new MyBikePage(authenticatedPage)
    await myBikePage.goto()

    await myBikePage.registerButton.click()

    await expect(authenticatedPage).toHaveURL(/\/app\/bike\/register/)
  })

  test('API登録済みバイクがマイバイク一覧に表示される', async ({
    authenticatedPage,
    authToken,
  }) => {
    await registerTestBike(authToken, {
      displacement: 400,
      totalMileage: 10000,
      nickname: 'E2Eテストバイク',
    })

    const myBikePage = new MyBikePage(authenticatedPage)
    await myBikePage.goto()

    await expect(myBikePage.bikeCard('E2Eテストバイク')).toBeVisible()
  })

  test('空状態の「最初のバイクを登録」ボタンでバイク登録ページへ遷移する', async ({
    authenticatedPage,
  }) => {
    const myBikePage = new MyBikePage(authenticatedPage)
    await myBikePage.goto()

    await myBikePage.emptyRegisterButton.click()

    await expect(authenticatedPage).toHaveURL(/\/app\/bike\/register/)
  })

  test('「グッズ一覧」ボタンをクリックするとグッズ一覧ページへ遷移する', async ({
    authenticatedPage,
  }) => {
    const myBikePage = new MyBikePage(authenticatedPage)
    await myBikePage.goto()

    await myBikePage.goodsListButton.click()

    await expect(authenticatedPage).toHaveURL(/\/app\/goods$/)
  })
})
