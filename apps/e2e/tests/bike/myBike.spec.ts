import { expect, test } from '../../fixtures/authenticatedPage'
import { registerTestBike } from '../../helpers/bikeHelper'
import { registerTestMaintenanceLog } from '../../helpers/maintenanceLogHelper'
import { MyBikePage } from '../../pages/myBikePage'

/**
 * 愛車ページ E2E テスト
 *
 * @remarks
 * Issue #575「愛車画面の再構成」により「マイバイク」一覧は廃止され、
 * /app/my-bike は常にアクティブ車両の /app/my-bike/{id} へ直接遷移する。
 */
test.describe('愛車ページ', () => {
  test('バイク未登録の状態で空状態メッセージが表示される', async ({
    authenticatedPage,
  }) => {
    const myBikePage = new MyBikePage(authenticatedPage)
    await myBikePage.goto()

    await expect(myBikePage.emptyMessage).toBeVisible()
    await expect(myBikePage.emptyRegisterButton).toBeVisible()
  })

  test('空状態の「最初のバイクを登録」ボタンでバイク登録ページへ遷移する', async ({
    authenticatedPage,
  }) => {
    const myBikePage = new MyBikePage(authenticatedPage)
    await myBikePage.goto()

    await myBikePage.emptyRegisterButton.click()

    await expect(authenticatedPage).toHaveURL(/\/app\/bike\/register/)
  })

  test('API登録済みバイクがあると、一覧を挟まずアクティブ車両の詳細へ直接遷移する', async ({
    authenticatedPage,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      displacement: 400,
      totalMileage: 10000,
      nickname: 'E2Eテストバイク',
    })

    const myBikePage = new MyBikePage(authenticatedPage)
    await myBikePage.goto()

    await expect(authenticatedPage).toHaveURL(
      new RegExp(`/app/my-bike/${myUserBikeId}`),
      { timeout: 15_000 }
    )
    await expect(myBikePage.heading('E2Eテストバイク')).toBeVisible()
  })

  test('バイク詳細に車両情報・計器・記録へのリンク・主アクションが表示される', async ({
    authenticatedPage,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      displacement: 400,
      totalMileage: 10000,
      nickname: '詳細確認用バイク',
    })

    const myBikePage = new MyBikePage(authenticatedPage)
    await myBikePage.gotoBike(myUserBikeId)

    await expect(myBikePage.heading('詳細確認用バイク')).toBeVisible()
    await expect(myBikePage.editButton).toBeVisible()

    // 車両情報（罫線区切りの2列リスト）
    await expect(authenticatedPage.getByText('現在ODO')).toBeVisible()
    await expect(authenticatedPage.getByText('10,000 km')).toBeVisible()

    // 計器（導出値。給油記録が無いため「—」表示になる）。
    // Playwrightの既定ビューポート（1280x720）はPC幅（1024px以上）に該当するため、
    // モバイル用の`BikeGauges`（テストID `bike-gauges`）は非表示になり、
    // PC用の添え数値`BikeStatsSection`（テストID `bike-stats-section`）が表示される
    // （Issue #575「05 画面案 ─ PC」愛車）。同じ「平均燃費」ラベルが両方に
    // 存在するため、非表示要素とのDOM上の衝突を避けるためテストIDで絞り込む。
    await expect(
      authenticatedPage.getByTestId('bike-stats-section').getByText('平均燃費')
    ).toBeVisible()

    // 記録へのリンク（件数付きの行リスト）
    await expect(myBikePage.recordLink('給油履歴')).toBeVisible()
    await expect(myBikePage.recordLink('ツーリング')).toBeVisible()
    await expect(myBikePage.recordLink('メンテナンス')).toBeVisible()

    // 主アクション（この画面から給油を記録できる）
    await expect(myBikePage.primaryFuelButton).toBeVisible()
  })

  test('メンテナンス記録があると、点検の予定に項目と残りの目安が表示される', async ({
    authenticatedPage,
    authToken,
  }) => {
    const myUserBikeId = await registerTestBike(authToken, {
      displacement: 400,
      totalMileage: 10000,
      nickname: '点検予定確認用バイク',
    })

    // ENGINE_OIL（推奨間隔3,000km）を6,000km時点で実施済みにし、
    // 現在10,000kmとの差分で「あと」または「超過」のいずれかが算出される状態を作る
    await registerTestMaintenanceLog(authToken, myUserBikeId, {
      performedAt: new Date().toISOString(),
      mileage: 6000,
      maintenanceType: 'ENGINE_OIL',
    })

    const myBikePage = new MyBikePage(authenticatedPage)
    await myBikePage.gotoBike(myUserBikeId)

    await expect(myBikePage.maintenanceScheduleSection).toBeVisible()
    await expect(
      myBikePage.maintenanceScheduleSection.getByText('エンジンオイル')
    ).toBeVisible()
    await expect(
      myBikePage.maintenanceScheduleSection.getByText(/あと|超過/)
    ).toBeVisible()

    // 全項目はメンテナンス履歴画面へのリンクから確認できる
    await myBikePage.maintenanceMoreLink.click()
    await expect(authenticatedPage).toHaveURL(
      new RegExp(`/app/my-bike/${myUserBikeId}/maintenance-logs`)
    )
  })
})
