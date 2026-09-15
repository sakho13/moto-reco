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
