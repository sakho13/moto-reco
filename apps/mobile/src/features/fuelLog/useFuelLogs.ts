import { useCallback } from 'react'
import useSWRInfinite from 'swr/infinite'
import type { ApiResponseFuelLogList } from '@repo/shared-types'
import {
  fetchFuelLogPage,
  FUEL_LOG_PAGE_SIZE,
  getFuelLogPagePath,
} from './fuelLogApi'

/**
 * 愛車の給油履歴を、ページを足しながら取得する
 *
 * @remarks
 * 画面からは直接呼ばず、`FuelLogsProvider` 経由で使う（登録・編集画面から
 * 一覧を取り直すために、同じ `useSWRInfinite` の `mutate` を共有する必要があるため）。
 *
 * @param myUserBikeId - 愛車のID。null なら取得しない
 */
export function useFuelLogs(myUserBikeId: string | null) {
  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<ApiResponseFuelLogList>(
      (pageIndex, previousPage: ApiResponseFuelLogList | null) => {
        if (!myUserBikeId) return null
        // 前のページが1ページ分に満たなければ、それが最後のページ
        if (previousPage && previousPage.length < FUEL_LOG_PAGE_SIZE) {
          return null
        }
        return getFuelLogPagePath(myUserBikeId, pageIndex + 1)
      },
      fetchFuelLogPage
    )

  const pages = data ?? []
  const lastPage = pages[pages.length - 1]
  const hasMore =
    lastPage !== undefined && lastPage.length === FUEL_LOG_PAGE_SIZE
  const isLoadingMore = isValidating && size > pages.length

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) void setSize(size + 1)
  }, [hasMore, isLoadingMore, setSize, size])

  /**
   * 読み込み済みの全ページを取り直す
   *
   * @remarks
   * 引数なしの `mutate()` は全ページを取り直す。グローバルの `mutate` は
   * `useSWRInfinite` のキーを対象にできず、`unstable_serialize` でキーを
   * 指定しても1ページ目しか取り直さないため使わない。
   */
  const refresh = useCallback(() => mutate(), [mutate])

  return {
    fuelLogs: pages.flat(),
    error,
    isLoading,
    isRefreshing: isValidating && !isLoadingMore && !isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  }
}

export type FuelLogsState = ReturnType<typeof useFuelLogs>
