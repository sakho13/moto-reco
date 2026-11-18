import { useCallback } from 'react'
import { useSWRConfig } from 'swr'
import useSWRInfinite from 'swr/infinite'
import type { ApiResponseFuelLogList } from '@repo/shared-types'
import {
  fetchFuelLogPage,
  FUEL_LOG_PAGE_SIZE,
  getFuelLogPagePath,
  isFuelLogKeyOf,
} from './fuelLogApi'

/**
 * 愛車の給油履歴を、ページを足しながら取得する
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

  return {
    fuelLogs: pages.flat(),
    error,
    isLoading,
    isRefreshing: isValidating && !isLoadingMore && !isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh: mutate,
  }
}

/**
 * 給油記録を登録・更新・削除した後に、関係するキャッシュを取り直す関数を返す
 *
 * @remarks
 * 同じ愛車の給油履歴一覧・給油記録の詳細を取り直す。総走行距離が変わることが
 * あるため、愛車一覧は呼び出し側で取り直すこと。
 */
export function useRevalidateFuelLogs() {
  const { mutate } = useSWRConfig()
  return useCallback(
    (myUserBikeId: string) =>
      mutate((key) => isFuelLogKeyOf(myUserBikeId, key)),
    [mutate]
  )
}
