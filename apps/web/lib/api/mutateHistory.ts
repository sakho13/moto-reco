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
