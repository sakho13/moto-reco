'use client'

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './page.module.css'
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

  return (
    <>
      <div className="w-full max-w-md flex flex-row gap-2 mb-4">
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

      <div className="w-full max-w-md space-y-4">
        {/* ツーリング情報 */}
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

        {/* スポット一覧 */}
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
                    {spot.latitude !== null && spot.longitude !== null && (
                      <a
                        href={`https://maps.google.com/?q=${spot.latitude},${spot.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                      >
                        地図で見る →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default withAuth(TouringDetailPage)
