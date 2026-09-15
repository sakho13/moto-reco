'use client'

import useSWR, { type SWRResponse } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseFuelInsight,
  SuccessResponse,
} from '@repo/shared-types'
import { authenticatedFetch } from '../api/client'

/**
 * バイク単位の燃費インサイト（平均燃費など）を取得するフック
 *
 * @remarks
 * 期間は既定値の `all`（全期間）を使う。ホームの「平均燃費」計器はこれを使う。
 * `apiGet` の型付きエンドポイント一覧（`API_EP`）は
 * `` `/api/v1/user-bike/bike/${string}` `` という汎用パターンも同時に持つため、
 * `apiGet` 経由だとキーが両方の型に一致してしまい交差型になる。
 * `useBikeHistory` と同様に `authenticatedFetch` を直接使って回避する。
 */
export function useFuelInsight(
  bikeId: string | null
): SWRResponse<ApiResponseFuelInsight, ApiV1Error> {
  return useSWR(
    bikeId ? `/api/v1/user-bike/bike/${bikeId}/fuel-insights` : null,
    async (url) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new ApiV1Error(
          errorData.errorCode || 'SERVER_ERROR',
          errorData.message || '燃費インサイトの取得に失敗しました'
        )
      }
      const json =
        (await response.json()) as SuccessResponse<ApiResponseFuelInsight>
      return json.data
    }
  )
}
