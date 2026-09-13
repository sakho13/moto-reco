import { mutate } from 'swr'

/**
 * ホーム（RecentHistorySection）とヒストリー一覧（history/page.tsx の useSWRInfinite）が
 * 購読している `/api/v1/user-bike/history` 系のSWRキーをまとめて再検証する。
 *
 * @remarks
 * ページングキーが複数存在するため、キー文字列の前方一致でマッチさせる。
 */
export async function mutateHistoryLists(): Promise<void> {
  await mutate(
    (key) =>
      typeof key === 'string' && key.startsWith('/api/v1/user-bike/history'),
    undefined,
    { revalidate: true }
  ).catch(() => {})
}
