'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import type {
  ApiResponsePhotoDetail,
  ApiResponseTouringSpotPhotoList,
  SuccessResponse,
} from '@repo/shared-types'
import { authenticatedFetch } from '@/lib/api/client'

export type SpotPhotoMap = ReadonlyMap<string, ApiResponsePhotoDetail[]>

/** ツーリング内のスポット写真のSWRキー */
export const getTouringSpotPhotosKey = (touringId: string): string =>
  `/api/v1/photo/touring/${touringId}/spots`

const fetchTouringSpotPhotos = async (
  url: string
): Promise<ApiResponseTouringSpotPhotoList> => {
  const res = await authenticatedFetch(url, { method: 'GET' })
  if (!res.ok) throw new Error('スポット写真の取得に失敗しました')
  const json =
    (await res.json()) as SuccessResponse<ApiResponseTouringSpotPhotoList>
  return json.data
}

/**
 * ツーリング内のスポット写真を1回のリクエストでまとめて取得し、スポットIDで引けるようにする
 *
 * @param enabled - false のあいだは取得しない
 */
export function useTouringSpotPhotos(touringId: string, enabled: boolean) {
  const key = getTouringSpotPhotosKey(touringId)
  // 署名付きURLは取得のたびに変わり、変わると同じ画像を読み込み直す
  const { data, mutate } = useSWR(
    enabled ? key : null,
    fetchTouringSpotPhotos,
    { revalidateIfStale: false, revalidateOnFocus: false }
  )

  const photosBySpotId = useMemo<SpotPhotoMap>(
    () => new Map((data ?? []).map((item) => [item.spotId, item.photos])),
    [data]
  )

  return { photosBySpotId, mutate }
}
