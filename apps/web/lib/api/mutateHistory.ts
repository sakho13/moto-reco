import { mutate } from 'swr'

/**
 * ホーム（HomeGauges・RecentHistorySection）とヒストリー一覧（history/page.tsx の
 * useSWRInfinite）が購読している `/api/v1/user-bike/history` 系・
 * `/api/v1/user-bike/bike/{id}/history` 系・`/api/v1/user-bike/bike/{id}/fuel-insights`
 * 系のSWRキーをまとめて再検証する。
 *
 * @remarks
 * ページングキーが複数存在するため、キー文字列の前方一致・正規表現でマッチさせる。
 */
export async function mutateHistoryLists(): Promise<void> {
  const bikeScopedPattern =
    /^\/api\/v1\/user-bike\/bike\/[^/]+\/(history|fuel-insights)(\?|$)/

  await mutate(
    (key) =>
      typeof key === 'string' &&
      (key.startsWith('/api/v1/user-bike/history') ||
        bikeScopedPattern.test(key)),
    undefined,
    { revalidate: true }
  ).catch(() => {})
}

/**
 * 給油履歴一覧（`/api/v1/user-bike/bike/{id}/fuel-logs` 系）のSWRキーを再検証する
 *
 * @remarks
 * `FuelLogRegisterModal` / `FuelLogEditModal` は元々クエリ文字列を含まない
 * 完全一致キー（`/api/v1/user-bike/bike/{id}/fuel-logs`）しか再検証しておらず、
 * `sort-by` / `period` などのクエリ付きキーを使う一覧（`FuelLogListSection` の
 * `useSWRInfinite` を除く）には反映されなかった。特にPC版の台帳
 * （`FuelLedgerSection` / `BikeFuelLedgerExcerpt` / 愛車カルテの添え数値・
 * 方眼グラフが共有する `periodFuelLogs`）はクエリ付きキーのみを使うため、
 * このままでは登録・編集直後に反映されない（Issue #575「05 画面案 ─ PC」）。
 * 前方一致で判定し、一覧・詳細どちらのキーもまとめて再検証する。
 */
export async function mutateFuelLogLists(bikeId: string): Promise<void> {
  const pattern = new RegExp(
    `^/api/v1/user-bike/bike/${bikeId}/fuel-logs(\\?|/|$)`
  )

  await mutate(
    (key) => typeof key === 'string' && pattern.test(key),
    undefined,
    { revalidate: true }
  ).catch(() => {})
}

/**
 * 点検予定（`/api/v1/user-bike/bike/{id}/maintenance-schedule`）のSWRキーを再検証する
 *
 * @remarks
 * `MaintenanceLogRegisterModal` は自身の呼び出し元向け
 * （`/maintenance-logs`）のキーしか再検証しないため、ホームの「点検の予定」
 * レール（`UpcomingMaintenanceRail`）から整備を記入した直後は、明示的に
 * 再検証しないと反映されない（Issue #575「05 画面案 ─ PC」）。
 * `limit` クエリ付きのキーにもマッチするよう前方一致で判定する。
 */
export async function mutateMaintenanceSchedule(bikeId: string): Promise<void> {
  const pattern = new RegExp(
    `^/api/v1/user-bike/bike/${bikeId}/maintenance-schedule(\\?|$)`
  )

  await mutate(
    (key) => typeof key === 'string' && pattern.test(key),
    undefined,
    { revalidate: true }
  ).catch(() => {})
}
