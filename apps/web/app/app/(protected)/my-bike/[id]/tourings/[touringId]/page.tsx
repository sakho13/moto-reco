'use client'

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './page.module.css'
import TouringRouteMap from '@/components/touring/TouringRouteMap'
import type { MapPoint } from '@/components/touring/TouringRouteMap'
import { apiGet } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function TouringDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bikeId = params.id as string
  const touringId = params.touringId as string

  const {
    data: touring,
    error: touringError,
    isLoading: touringLoading,
  } = useSWR(
    bikeId && touringId
      ? `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}`
      : null,
    async (url) => {
      const response = await apiGet(
        url as `/api/v1/user-bike/bike/${string}/tourings/${string}`
      )
      return response.data
    }
  )

  const { data: spots, isLoading: spotsLoading } = useSWR(
    bikeId && touringId
      ? `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`
      : null,
    async (url) => {
      const response = await apiGet(
        url as `/api/v1/user-bike/bike/${string}/tourings/${string}/spots`
      )
      return response.data
    }
  )

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const formatVisitedAt = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  if (touringLoading) {
    return (
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center min-h-100">
          <p className="text-lg">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (touringError) {
    return (
      <>
        <div className="mb-4">
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}/tourings`)}
            variant="cloud"
          >
            ← 戻る
          </Button>
        </div>
        <div className={styles.card}>
          <h1 className="text-2xl font-bold mb-4 text-red-600">エラー</h1>
          <p className={`mb-4 ${styles.bodyText}`}>
            {touringError instanceof ApiV1Error
              ? touringError.message
              : 'ツーリング情報の取得に失敗しました'}
          </p>
        </div>
      </>
    )
  }

  const distance =
    touring?.startMileage !== null && touring?.endMileage !== null
      ? (touring?.endMileage ?? 0) - (touring?.startMileage ?? 0)
      : null

  const mapPoints: MapPoint[] = []

  if (touring?.startLatitude != null && touring?.startLongitude != null) {
    mapPoints.push({
      lat: touring.startLatitude,
      lng: touring.startLongitude,
      label: '出発地',
      type: 'start',
    })
  }

  if (spots) {
    spots
      .filter(
        (s: ApiResponseSpotDetail) => s.latitude != null && s.longitude != null
      )
      .forEach((s: ApiResponseSpotDetail, i: number) => {
        mapPoints.push({
          lat: s.latitude!,
          lng: s.longitude!,
          label: s.name ?? `スポット ${i + 1}`,
          type: 'spot',
        })
      })
  }

  if (
    touring?.status === 'COMPLETED' &&
    touring?.endLatitude != null &&
    touring?.endLongitude != null
  ) {
    mapPoints.push({
      lat: touring.endLatitude,
      lng: touring.endLongitude,
      label: '終着地',
      type: 'end',
    })
  }

  const hasMap = mapPoints.length > 0

  const touringInfoCard = (
    <div className={styles.card}>
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-xl font-bold">{touring?.title}</h1>
        <span
          className={
            touring?.status === 'STARTED'
              ? styles.statusStarted
              : styles.statusCompleted
          }
        >
          {touring?.status === 'STARTED' ? '進行中' : '完了'}
        </span>
      </div>

      <div className={`space-y-2 text-sm ${styles.bodyText}`}>
        <div>
          <span className="font-medium">開始: </span>
          {touring?.startDate ? formatDate(touring.startDate) : '-'}
        </div>
        <div>
          <span className="font-medium">終了: </span>
          {touring?.endDate ? formatDate(touring.endDate) : '-'}
        </div>
        {distance !== null && (
          <div>
            <span className="font-medium">走行距離: </span>
            {distance.toLocaleString()}km
          </div>
        )}
      </div>
    </div>
  )

  const spotsCard = (
    <div className={styles.card}>
      <h2 className="text-lg font-semibold mb-4">立ち寄りスポット</h2>

      {spotsLoading ? (
        <p className={`text-sm ${styles.mutedText}`}>読み込み中...</p>
      ) : !spots || spots.length === 0 ? (
        <p className={`text-sm ${styles.mutedText}`}>
          スポットはまだ記録されていません
        </p>
      ) : (
        <div className="space-y-3">
          {spots.map((spot: ApiResponseSpotDetail, index: number) => (
            <div key={spot.spotId} className={styles.spotItem}>
              <div className={styles.spotBadge}>{index + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm truncate">
                    {spot.name ?? '無名スポット'}
                  </p>
                  <span
                    className={`shrink-0 ${styles.dimText}`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {formatVisitedAt(spot.visitedAt)}
                  </span>
                </div>
                {spot.memo && (
                  <p
                    className={`text-xs mt-1 wrap-break-word ${styles.mutedText}`}
                  >
                    {spot.memo}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <div
        className={`w-full flex flex-row gap-2 mb-4 ${hasMap ? 'max-w-5xl' : 'max-w-md'}`}
      >
        <Button
          onClick={() => router.push(`/app/my-bike/${bikeId}/tourings`)}
          variant="cloud"
        >
          ← 戻る
        </Button>
        <Button
          onClick={() =>
            router.push(`/app/my-bike/${bikeId}/tourings/${touringId}/edit`)
          }
          variant="cloud"
        >
          編集
        </Button>
      </div>

      {hasMap ? (
        <div className="w-full max-w-5xl flex flex-col md:flex-row md:gap-6 md:items-start gap-4">
          {/* 左: マップ */}
          <div className="md:flex-1 min-w-0">
            <div className={`${styles.card} h-full`}>
              <TouringRouteMap
                points={mapPoints}
                containerClassName={styles.mapContainerLarge}
              />
            </div>
          </div>
          {/* 右: 情報 + スポット */}
          <div className="md:w-80 lg:w-96 shrink-0 space-y-4">
            {touringInfoCard}
            {spotsCard}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-4">
          {touringInfoCard}
          {spotsCard}
        </div>
      )}
    </>
  )
}

export default withAuth(TouringDetailPage)
