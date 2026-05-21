import { expect } from '../../fixtures/authenticatedPage'
import { test } from '../../fixtures/authenticatedPage'
import { BikeRegisterPage } from '../../pages/bikeRegisterPage'

/**
 * バイク登録フロー E2E テスト
 */
test.describe('バイク登録フロー', () => {
  test('3ステップを経てバイクを登録し、ホームへリダイレクトされる', async ({
    authenticatedPage,
  }) => {
    const bikeRegisterPage = new BikeRegisterPage(authenticatedPage)
    await bikeRegisterPage.goto()

    await expect(bikeRegisterPage.heading).toBeVisible()

    await bikeRegisterPage.advanceToStep3()
    await bikeRegisterPage.fillAndSubmit(400, 12000, 'テストバイク')

    await expect(authenticatedPage).toHaveURL(/\/app\/home/, {
      timeout: 15_000,
    })
  })

  test('ステップ1・2の「次へ」でステップ3のフォームが表示される', async ({
    authenticatedPage,
  }) => {
    const bikeRegisterPage = new BikeRegisterPage(authenticatedPage)
    await bikeRegisterPage.goto()

    await bikeRegisterPage.nextButton.click()
    await expect(
      authenticatedPage.getByText('ステップ2: バイクを検索')
    ).toBeVisible()

    await bikeRegisterPage.nextButton.click()
    await expect(
      authenticatedPage.getByText('ステップ3: 登録情報を入力')
    ).toBeVisible()
    await expect(bikeRegisterPage.displacementInput).toBeVisible()
    await expect(bikeRegisterPage.totalMileageInput).toBeVisible()
  })

  test('ステップ3で必須の排気量を入力しないとフォームが送信されない', async ({
    authenticatedPage,
  }) => {
    const bikeRegisterPage = new BikeRegisterPage(authenticatedPage)
    await bikeRegisterPage.goto()
    await bikeRegisterPage.advanceToStep3()

    // 走行距離のみ入力して排気量は空のまま送信
    await bikeRegisterPage.totalMileageInput.fill('12000')
    await bikeRegisterPage.submitButton.click()

    // HTML5 バリデーションにより /app/bike/register から遷移しない
    await expect(authenticatedPage).toHaveURL(/\/app\/bike\/register/)
  })

  test('ステップ3の「戻る」でステップ2へ戻る', async ({
    authenticatedPage,
  }) => {
    const bikeRegisterPage = new BikeRegisterPage(authenticatedPage)
    await bikeRegisterPage.goto()
    await bikeRegisterPage.advanceToStep3()

    await bikeRegisterPage.backButton.click()

    await expect(
      authenticatedPage.getByText('ステップ2: バイクを検索')
    ).toBeVisible()
  })
})
