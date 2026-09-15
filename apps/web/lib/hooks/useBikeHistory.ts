'use client'

import useSWR, { type SWRResponse } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type { ApiResponseBikeHistoryList, SuccessResponse } from '@repo/shared-types'
import { authenticatedFetch } from '../api/client'

/**
 * バイク単位のヒストリー（給油・ツーリング）を取得するフック
 *
 * @remarks
 * `/api/v1/user-bike/bike/{id}/history` はクエリ型定義（`API_EP`）に
 * 含まれていないため、`RecentHistorySection` と同様に `authenticatedFetch` を
 * 直接使う。新しく発生日時の降順で返るため、先頭が最新の記録になる。
 */
export function useBikeHistory(
  bikeId: string | null
): SWRResponse<ApiResponseBikeHistoryList, ApiV1Error> {
  return useSWR(
    bikeId ? `/api/v1/user-bike/bike/${bikeId}/history` : null,
    async (url) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new ApiV1Error(
          errorData.errorCode || 'SERVER_ERROR',
          errorData.message || 'ヒストリーの取得に失敗しました'
        )
      }
      const json =
        (await response.json()) as SuccessResponse<ApiResponseBikeHistoryList>
      return json.data
    }
  )
}
