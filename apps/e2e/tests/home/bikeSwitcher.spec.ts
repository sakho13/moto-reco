import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { BikeRegisterPage } from '../../pages/bikeRegisterPage'
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

  test('バイクが1台のみの場合でも、ヘッダーのトリガーからドロップダウンを開ける', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    // 以前は2台以上のときしかトリガーが表示されず、1台のときに2台目を
    // 追加する導線がどこにも無かった（Issue #575で `/app/my-bike` の一覧が
    // 廃止された際に失われた回帰）。1台でもトリガーは表示され、開ける。
    await registerTestBike(authToken, { nickname: '単独バイク' })

    const homePage = new HomePage(page)
    await homePage.goto()

    const bikeSwitcher = new BikeSwitcherPage(page)
    await expect(bikeSwitcher.trigger).toBeVisible()
    await expect(bikeSwitcher.trigger).toHaveAccessibleName(/単独バイク/)

    await bikeSwitcher.open()
    await expect(page.getByRole('option', { name: '単独バイク' })).toBeVisible()
    await expect(bikeSwitcher.addBikeButton).toBeVisible()
    await expect(bikeSwitcher.addBikeButton).toBeEnabled()
  })
})

test.describe('2台目以降のバイク追加導線(#575)', () => {
  test('バイクを1台登録済みの状態から、車両セレクタ経由で2台目の登録画面に到達できる', async ({
    authenticatedPage: page,
    authToken,
  }) => {
    // Issue #575で `/app/my-bike` の一覧ページ（「バイクを登録」ボタン常設）が
    // 廃止されて以降、2台目以降を追加する導線がアプリのどこにも無かった回帰。
    // ヘッダーの車両セレクタのドロップダウン最下部に導線を復活させた。
    await registerTestBike(authToken, { nickname: '1台目の相棒' })

    const homePage = new HomePage(page)
    await homePage.goto()

    const bikeSwitcher = new BikeSwitcherPage(page)
    await bikeSwitcher.open()
    await bikeSwitcher.addBikeButton.click()

    await expect(page).toHaveURL(/\/app\/bike\/register/)
    const bikeRegisterPage = new BikeRegisterPage(page)
    await expect(bikeRegisterPage.heading).toBeVisible()

    // 実際に2台目を登録し、ヘッダーの車両セレクタが2台構成に更新されることも
    // 合わせて確認する（追加導線が最後まで機能することの裏付け）。
    await bikeRegisterPage.advanceToStep3()
    await bikeRegisterPage.fillAndSubmit(250, 3000, '2台目の新入り')

    await expect(page).toHaveURL(/\/app\/home/, { timeout: 15_000 })
    await expect(bikeSwitcher.trigger).toBeVisible()

    await bikeSwitcher.open()
    await expect(
      page.getByRole('option', { name: '1台目の相棒' })
    ).toBeVisible()
    await expect(
      page.getByRole('option', { name: '2台目の新入り' })
    ).toBeVisible()
  })
})
