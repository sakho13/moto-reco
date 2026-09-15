import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { BikeSwitcherPage } from '../../pages/bikeSwitcherPage'
import { HomePage } from '../../pages/homePage'

test.describe('アクティブ車両の切り替え(#575)', () => {
  test('バイクを2台登録した状態でヘッダーから切り替えると、アクティブ車両が切り替わる', async ({
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

    // 初期状態ではどちらか一方の車両がアクティブ車両として表示されている
    const initialLabel = await bikeSwitcher.trigger.getAttribute('aria-label')
    const isShowingA = initialLabel?.includes(bikeAName) ?? false
    const targetName = isShowingA ? bikeBName : bikeAName

    await bikeSwitcher.selectBike(targetName)

    // 切り替え後、ヘッダーのアクティブ車両表示が新しい車両に変わる
    await expect(bikeSwitcher.trigger).toHaveAccessibleName(
      new RegExp(targetName)
    )

    // localStorageに永続化され、リロード後も選択が保持される
    await page.reload()
    await expect(bikeSwitcher.trigger).toHaveAccessibleName(
      new RegExp(targetName)
    )
  })

  test('バイクが1台のみの場合、ヘッダーに切り替えトリガーは表示されない', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    await registerTestBike(authToken, { nickname: '単独バイク' })

    const homePage = new HomePage(page)
    await homePage.goto()

    const bikeSwitcher = new BikeSwitcherPage(page)
    // BikeSwitcherはモバイル・デスクトップ両方のヘッダーに配置され、
    // CSSで一方のみ表示される（非表示側はdisplay:noneでアクセシビリティ
    // ツリーから除外される）。getByText は非表示要素も拾ってしまうため、
    // ロールで一意に定まる表示中のヘッダーに絞り込んで検証する
    await expect(page.getByRole('banner').getByText('単独バイク')).toBeVisible()
    await expect(bikeSwitcher.trigger).toHaveCount(0)
  })
})
