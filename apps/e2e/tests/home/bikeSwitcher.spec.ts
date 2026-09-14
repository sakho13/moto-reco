import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { BikeSwitcherPage } from '../../pages/bikeSwitcherPage'
import { HomePage } from '../../pages/homePage'

test.describe('アクティブ車両の切り替え(#575)', () => {
  test('バイクを2台登録した状態でヘッダーから切り替えると、ホームの表示が切り替わる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    const bikeAName = '切り替えテストA号'
    const bikeBName = '切り替えテストB号'

    await registerTestBike(authToken, { nickname: bikeAName })
    await registerTestBike(authToken, { nickname: bikeBName })

    const homePage = new HomePage(page)
    await homePage.goto()

    const bikeSwitcher = new BikeSwitcherPage(page)

    // バイク2台のため、ヘッダーに切り替えトリガーが表示される
    await expect(bikeSwitcher.trigger).toBeVisible()

    // 初期状態ではどちらか一方の車両がツーリング・給油セクションに表示されている
    await expect(
      homePage.touringSection
        .getByText(bikeAName)
        .or(homePage.touringSection.getByText(bikeBName))
    ).toBeVisible()

    const isShowingA = await homePage.touringSection
      .getByText(bikeAName)
      .isVisible()
    const targetName = isShowingA ? bikeBName : bikeAName

    await bikeSwitcher.selectBike(targetName)

    // 切り替え後、ツーリング・給油の両セクションが新しいアクティブ車両の表示に変わる
    await expect(homePage.touringSection).toContainText(targetName)
    await expect(homePage.fuelSection).toContainText(targetName)

    // localStorageに永続化され、リロード後も選択が保持される
    await page.reload()
    await expect(homePage.touringSection).toContainText(targetName)
    await expect(homePage.fuelSection).toContainText(targetName)
  })

  test('バイクが1台のみの場合、ヘッダーに切り替えトリガーは表示されない', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    await registerTestBike(authToken, { nickname: '単独バイク' })

    const homePage = new HomePage(page)
    await homePage.goto()

    const bikeSwitcher = new BikeSwitcherPage(page)
    await expect(homePage.touringSection).toContainText('単独バイク')
    await expect(bikeSwitcher.trigger).toHaveCount(0)
  })
})
