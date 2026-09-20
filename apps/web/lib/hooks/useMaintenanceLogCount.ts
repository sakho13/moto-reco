'use client'

import useSWR from 'swr'
import type {
  ApiResponseMaintenanceLogList,
  SuccessResponse,
} from '@repo/shared-types'
import { authenticatedFetch } from '@/lib/api/client'

// 一覧APIは総件数を返さないため、上限いっぱい（100件）まで取得して件数の
// 近似値とする。`AttachedGoodsSection` / メンテナンス履歴画面の「項目別ビュー」で
// 使われているのと同じ回避策（新しいAPIは追加しない）
const COUNT_FETCH_SIZE = 100

/**
 * バイクのメンテナンス記録件数を取得する
 *
 * @remarks
 * 一覧APIの件数を流用するため、愛車ページの記録リンク（`BikeRecordLinks`）と
 * PCサイドバーの記録リンク（`SidebarBikeRecordLinks`）で共有する。
 * `bikeId` が `null` の間はフェッチしない。
 */
export function useMaintenanceLogCount(
  bikeId: string | null
): number | undefined {
  const { data } = useSWR(
    bikeId
      ? `/api/v1/user-bike/bike/${bikeId}/maintenance-logs?per-size=${COUNT_FETCH_SIZE}`
      : null,
    async (url: string) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) throw new Error('failed')
      const json =
        (await response.json()) as SuccessResponse<ApiResponseMaintenanceLogList>
      return json.data.length
    }
  )
  return data
}
