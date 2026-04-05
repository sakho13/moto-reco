'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './page.module.css'
import { EditIcon } from '@/components/icons/EditIcon'
import { SpotEditModal } from '@/components/spot/SpotEditModal'
import { TouringEditModal } from '@/components/touring/TouringEditModal'
import { TouringLocationEditModal } from '@/components/touring/TouringLocationEditModal'
import TouringRouteMap from '@/components/touring/TouringRouteMap'
import type { MapPoint } from '@/components/touring/TouringRouteMap'
import { apiGet } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function buildGoogleMapsUrl(points: MapPoint[]): string | null {
  const first = points[0]
  const last = points[points.length - 1]
  if (!first) return null
  if (points.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${first.lat},${first.lng}`
  }
  if (!last) return null
  const origin = `${first.lat},${first.lng}`
  const destination = `${last.lat},${last.lng}`
  const waypoints = points
    .slice(1, -1)
    .map((p) => `${p.lat},${p.lng}`)
    .join('|')
  const base = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
  return waypoints ? `${base}&waypoints=${encodeURIComponent(waypoints)}` : base
}

function TouringDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bikeId = params.id as string
  const touringId = params.touringId as string
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingLocationTarget, setEditingLocationTarget] = useState<
    'start' | 'end' | null
  >(null)
  const [editingSpot, setEditingSpot] = useState<ApiResponseSpotDetail | null>(
    null
  )

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

  const handleEditSuccess = async (action: 'update' | 'delete') => {
    if (action === 'delete') {
      router.push(`/app/my-bike/${bikeId}/tourings`)
    } else {
      await mutate(`/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}`)
      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`
      )
      setIsEditModalOpen(false)
    }
  }

  const handleLocationEditSuccess = async () => {
    await mutate(`/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}`)
    setEditingLocationTarget(null)
  }

  const handleSpotEditSuccess = async () => {
    await mutate(`/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`)
    setEditingSpot(null)
  }

  const hasMap = mapPoints.length > 0
  const googleMapsUrl = buildGoogleMapsUrl(mapPoints)

  const startLocation =
    touring?.startLatitude != null && touring?.startLongitude != null
      ? { lat: touring.startLatitude, lng: touring.startLongitude }
      : null

  const endLocation =
    touring?.endLatitude != null && touring?.endLongitude != null
      ? { lat: touring.endLatitude, lng: touring.endLongitude }
      : null

  const touringInfoCard = (
    <div className={styles.card}>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{touring?.title}</h1>
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
        <button
          onClick={() => setIsEditModalOpen(true)}
          className={styles.editButton}
          aria-label="編集"
        >
          <EditIcon />
        </button>
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
      ) : (
        <div className="space-y-3">
          {/* 出発地 */}
          <div className={styles.spotItem}>
            <div className={styles.startBadge}>出</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm">出発地</p>
                <button
                  onClick={() => setEditingLocationTarget('start')}
                  className={styles.editButton}
                  aria-label="出発地を編集"
                >
                  <EditIcon />
                </button>
              </div>
              {startLocation ? (
                <p className={`text-xs mt-1 ${styles.mutedText}`}>
                  {startLocation.lat.toFixed(5)}, {startLocation.lng.toFixed(5)}
                </p>
              ) : (
                <p className={`text-xs mt-1 ${styles.mutedText}`}>位置未設定</p>
              )}
            </div>
          </div>

          {/* 立ち寄りスポット */}
          {spots && spots.length > 0
            ? spots.map((spot: ApiResponseSpotDetail, index: number) => (
                <div key={spot.spotId} className={styles.spotItem}>
                  <div className={styles.spotBadge}>{index + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">
                        {spot.name ?? '無名スポット'}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={styles.dimText}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {formatVisitedAt(spot.visitedAt)}
                        </span>
                        <button
                          onClick={() => setEditingSpot(spot)}
                          className={styles.editButton}
                          aria-label="スポットを編集"
                        >
                          <EditIcon />
                        </button>
                      </div>
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
              ))
            : null}

          {/* スポットがない場合のメッセージ */}
          {(!spots || spots.length === 0) && (
            <p className={`text-sm ${styles.mutedText}`}>
              スポットはまだ記録されていません
            </p>
          )}

          {/* 終着地（COMPLETEDの場合のみ表示） */}
          {touring?.status === 'COMPLETED' && (
            <div className={styles.spotItem}>
              <div className={styles.endBadge}>着</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">終着地</p>
                  <button
                    onClick={() => setEditingLocationTarget('end')}
                    className={styles.editButton}
                    aria-label="終着地を編集"
                  >
                    <EditIcon />
                  </button>
                </div>
                {endLocation ? (
                  <p className={`text-xs mt-1 ${styles.mutedText}`}>
                    {endLocation.lat.toFixed(5)}, {endLocation.lng.toFixed(5)}
                  </p>
                ) : (
                  <p className={`text-xs mt-1 ${styles.mutedText}`}>
                    位置未設定
                  </p>
                )}
              </div>
            </div>
          )}
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
      </div>

      {hasMap ? (
        <div className="w-full max-w-5xl flex flex-col md:flex-row md:gap-6 md:items-start gap-4">
          <div className="md:flex-1 min-w-0">
            <div className={`${styles.card} h-full`}>
              <div className={styles.mapWrapper}>
                <TouringRouteMap
                  points={mapPoints}
                  containerClassName={styles.mapContainerLarge}
                />
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.googleMapsLink}
                  >
                    Googleマップで経路を表示
                  </a>
                )}
              </div>
            </div>
          </div>
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

      {isEditModalOpen && (
        <TouringEditModal
          bikeId={bikeId}
          touringId={touringId}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {editingLocationTarget && (
        <TouringLocationEditModal
          bikeId={bikeId}
          touringId={touringId}
          type={editingLocationTarget}
          initialLocation={
            editingLocationTarget === 'start' ? startLocation : endLocation
          }
          onClose={() => setEditingLocationTarget(null)}
          onSuccess={handleLocationEditSuccess}
        />
      )}

      {editingSpot && (
        <SpotEditModal
          bikeId={bikeId}
          touringId={touringId}
          spot={editingSpot}
          onClose={() => setEditingSpot(null)}
          onSuccess={handleSpotEditSuccess}
        />
      )}
    </>
  )
}

export default withAuth(TouringDetailPage)
