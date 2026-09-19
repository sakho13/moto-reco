import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { BikeSwitcherPage } from '../../pages/bikeSwitcherPage'
import { HomePage } from '../../pages/homePage'
import { MyBikePage } from '../../pages/myBikePage'

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

  test('愛車詳細画面を表示中に切り替えても、選択した車両のまま上書きされない', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    // 回帰再現(Codex review on #586): 愛車詳細Aを表示中にBikeSwitcherでBを
    // 選ぶと、ActiveBikeContextのsetActiveBikeIdがProviderの再レンダーごとに
    // 新しい関数参照になり、これを依存配列に含む詳細ページのuseEffectが
    // 再実行されて、直前に選んだBがAへ即座に戻されてしまっていた
    // （詳細ページ自体の表示内容はURLのidに紐づくため変わらないが、
    // ヘッダーのアクティブ車両表示（BikeSwitcher）がAに戻ってしまう）。
    const bikeAName = '詳細切り替えテストA号'
    const bikeBName = '詳細切り替えテストB号'

    const bikeAId = await registerTestBike(authToken, { nickname: bikeAName })
    await registerTestBike(authToken, { nickname: bikeBName })

    const myBikePage = new MyBikePage(page)
    await myBikePage.gotoBike(bikeAId)
    await expect(myBikePage.heading(bikeAName)).toBeVisible()

    const bikeSwitcher = new BikeSwitcherPage(page)
    await bikeSwitcher.selectBike(bikeBName)

    // 切り替え後、ヘッダーのアクティブ車両表示がBのまま安定する（Aへ戻らない）。
    // 修正前はuseEffectの再実行でAへ即座に戻るため、このアサーションは
    // 一度も成立せずタイムアウトしていた。
    await expect(bikeSwitcher.trigger).toHaveAccessibleName(
      new RegExp(bikeBName)
    )
    // 詳細ページ自体はURLのid（A）に紐づいたままで良い
    await expect(myBikePage.heading(bikeAName)).toBeVisible()
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
