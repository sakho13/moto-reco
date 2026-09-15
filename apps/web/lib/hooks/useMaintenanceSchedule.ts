'use client'

import useSWR, { type SWRResponse } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseMaintenanceScheduleList,
  SuccessResponse,
} from '@repo/shared-types'
import { authenticatedFetch } from '../api/client'

/**
 * バイク単位の点検予定（メンテナンス項目ごとの「あと◯km」）を取得するフック
 *
 * @remarks
 * `/api/v1/user-bike/bike/{id}/maintenance-schedule` は `apiGet` の型付き
 * エンドポイント一覧（`API_EP`）に含まれていないため、`useBikeHistory` /
 * `useFuelInsight` と同様に `authenticatedFetch` を直接使う。
 * 残りが少ない順に返るため、先頭が最も優先度の高い項目になる。
 */
export function useMaintenanceSchedule(
  bikeId: string | null,
  limit?: number
): SWRResponse<ApiResponseMaintenanceScheduleList, ApiV1Error> {
  const query = limit ? `?limit=${limit}` : ''

  return useSWR(
    bikeId
      ? `/api/v1/user-bike/bike/${bikeId}/maintenance-schedule${query}`
      : null,
    async (url) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new ApiV1Error(
          errorData.errorCode || 'SERVER_ERROR',
          errorData.message || '点検予定の取得に失敗しました'
        )
      }
      const json =
        (await response.json()) as SuccessResponse<ApiResponseMaintenanceScheduleList>
      return json.data
    }
  )
}
