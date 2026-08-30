'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { getCurrentDate, formatDate } from '@repo/shared-utils'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import styles from './page.module.css'
import { EditIcon } from '@/components/icons/EditIcon'
import { FuelIcon } from '@/components/icons/FuelIcon'
import { TouringPhotosCard } from '@/components/photo/TouringPhotosCard'
import { SpotAddModal } from '@/components/spot/SpotAddModal'
import { SpotEditModal } from '@/components/spot/SpotEditModal'
import { RouteTimeline } from '@/components/touring/RouteTimeline'
import type { RouteTimelineItem } from '@/components/touring/RouteTimeline'
import { TouringEditModal } from '@/components/touring/TouringEditModal'
import { TouringFuelLogLinkModal } from '@/components/touring/TouringFuelLogLinkModal'
import { TouringLocationEditModal } from '@/components/touring/TouringLocationEditModal'
import TouringRouteMap from '@/components/touring/TouringRouteMap'
import type { MapPoint } from '@/components/touring/TouringRouteMap'
import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'
import {
  buildGoogleMapsRouteUrl,
  buildGoogleMapsTwoPointUrl,
  calcTravelMinutes,
} from '@/lib/utils/googleMaps'

function TouringDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bikeId = params.id as string
  const touringId = params.touringId as string
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isFuelLogLinkModalOpen, setIsFuelLogLinkModalOpen] = useState(false)
  const [editingLocationTarget, setEditingLocationTarget] = useState<
    'start' | 'end' | null
  >(null)
  const [editingSpot, setEditingSpot] = useState<ApiResponseSpotDetail | null>(
    null
  )
  const [addModalType, setAddModalType] = useState<'SPOT' | 'BREAK' | null>(
    null
  )
  const [localSpots, setLocalSpots] = useState<ApiResponseSpotDetail[]>([])
  const [isBreakLoading, setIsBreakLoading] = useState(false)

  const { data: profile } = useSWR('/api/v1/user/profile', async (url) => {
    const response = await apiGet(url)
    return response.data
  })
  const isAdmin = profile?.role === 'ADMIN'

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

  useEffect(() => {
    if (spots) {
      setLocalSpots(spots)
    }
  }, [spots])

  const formatVisitedAt = (dateString: string | null) => {
    if (!dateString) return '—'
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

  const handleReorder = async (newOrderIds: string[]) => {
    const previous = localSpots
    const reordered = newOrderIds
      .map((id) => localSpots.find((s) => s.spotId === id))
      .filter((s): s is ApiResponseSpotDetail => s !== undefined)
    setLocalSpots(reordered)

    try {
      await apiPatch(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots/reorder`,
        { spotIds: reordered.map((s) => s.spotId) }
      )
      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`
      )
    } catch (err) {
      setLocalSpots(previous)
      toast.error(
        err instanceof ApiV1Error ? err.message : '並び替えに失敗しました'
      )
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

  if (localSpots) {
    localSpots
      .filter(
        (s: ApiResponseSpotDetail) => s.latitude != null && s.longitude != null
      )
      .forEach((s: ApiResponseSpotDetail, i: number) => {
        mapPoints.push({
          lat: s.latitude!,
          lng: s.longitude!,
          label:
            s.name ??
            (s.type === 'BREAK' ? `休憩 ${i + 1}` : `スポット ${i + 1}`),
          type: s.type === 'BREAK' ? 'break' : 'spot',
        })
      })
  }

  const showDestination =
    touring?.status === 'COMPLETED' ||
    (touring?.status === 'STARTED' && touring?.endLatitude != null)

  if (
    showDestination &&
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

  const _mutateTouringAndSpots = async () => {
    await Promise.all([
      mutate(`/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}`),
      mutate(`/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`),
    ])
  }

  const handleSpotEditSuccess = async () => {
    await _mutateTouringAndSpots()
    setEditingSpot(null)
  }

  const handleSpotAddSuccess = async () => {
    await _mutateTouringAndSpots()
    setAddModalType(null)
  }

  const handleSpotDeleteSuccess = async () => {
    await _mutateTouringAndSpots()
    setEditingSpot(null)
  }

  const currentBreak =
    localSpots.find(
      (s) => s.type === 'BREAK' && s.arrivedAt !== null && s.departedAt === null
    ) ?? null

  const handleQuickBreakStart = async () => {
    setIsBreakLoading(true)
    try {
      await apiPost(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`,
        { type: 'BREAK', arrivedAt: getCurrentDate() }
      )
      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`
      )
      toast.success('休憩を開始しました')
    } catch (err) {
      toast.error(
        err instanceof ApiV1Error ? err.message : '休憩の開始に失敗しました'
      )
    } finally {
      setIsBreakLoading(false)
    }
  }

  const handleQuickBreakEnd = async () => {
    if (!currentBreak) return
    setIsBreakLoading(true)
    try {
      await apiPatch(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots/${currentBreak.spotId}`,
        { departedAt: getCurrentDate() }
      )
      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`
      )
      toast.success('休憩を終了しました')
    } catch (err) {
      toast.error(
        err instanceof ApiV1Error ? err.message : '休憩の終了に失敗しました'
      )
    } finally {
      setIsBreakLoading(false)
    }
  }

  const hasMap = mapPoints.length > 0
  const googleMapsUrl = buildGoogleMapsRouteUrl(mapPoints)

  const startLocation =
    touring?.startLatitude != null && touring?.startLongitude != null
      ? { lat: touring.startLatitude, lng: touring.startLongitude }
      : null

  const endLocation =
    touring?.endLatitude != null && touring?.endLongitude != null
      ? { lat: touring.endLatitude, lng: touring.endLongitude }
      : null

  // 出発地・スポット・終着地間の経路リンク一覧
  const travelLinks = new Map<
    string,
    { href: string; minutes: number | null }
  >()

  if (
    startLocation != null &&
    localSpots[0]?.latitude != null &&
    localSpots[0]?.longitude != null
  ) {
    travelLinks.set('start', {
      href: buildGoogleMapsTwoPointUrl(startLocation, {
        lat: localSpots[0]!.latitude!,
        lng: localSpots[0]!.longitude!,
      }),
      minutes: calcTravelMinutes(touring?.startDate, localSpots[0]?.arrivedAt),
    })
  } else if (
    localSpots.length === 0 &&
    startLocation != null &&
    showDestination &&
    endLocation != null
  ) {
    travelLinks.set('start', {
      href: buildGoogleMapsTwoPointUrl(startLocation, endLocation),
      minutes: calcTravelMinutes(touring?.startDate, touring?.endDate),
    })
  }

  localSpots.forEach((spot, index) => {
    const nextSpot = localSpots[index + 1]
    if (
      nextSpot &&
      spot.latitude != null &&
      spot.longitude != null &&
      nextSpot.latitude != null &&
      nextSpot.longitude != null
    ) {
      travelLinks.set(spot.spotId, {
        href: buildGoogleMapsTwoPointUrl(
          { lat: spot.latitude, lng: spot.longitude },
          { lat: nextSpot.latitude, lng: nextSpot.longitude }
        ),
        minutes: calcTravelMinutes(spot.departedAt, nextSpot.arrivedAt),
      })
    }
  })

  if (
    showDestination &&
    endLocation != null &&
    localSpots.at(-1)?.latitude != null &&
    localSpots.at(-1)?.longitude != null
  ) {
    travelLinks.set(localSpots.at(-1)!.spotId, {
      href: buildGoogleMapsTwoPointUrl(
        {
          lat: localSpots.at(-1)!.latitude!,
          lng: localSpots.at(-1)!.longitude!,
        },
        endLocation
      ),
      minutes: calcTravelMinutes(
        localSpots.at(-1)?.departedAt,
        touring?.endDate
      ),
    })
  }

  // RouteTimeline 表示用のアイテム一覧
  const timelineItems: RouteTimelineItem[] = [
    {
      id: 'start',
      type: 'START',
      name: '出発地',
      latitude: touring?.startLatitude,
      longitude: touring?.startLongitude,
      travelLink: travelLinks.get('start') ?? null,
      onEdit: () => setEditingLocationTarget('start'),
    },
    ...localSpots.map((spot): RouteTimelineItem => {
      const stayInfo =
        spot.arrivedAt || spot.departedAt
          ? `実績: 到着 ${spot.arrivedAt ? formatVisitedAt(spot.arrivedAt) : '—'} 〜 出発 ${spot.departedAt ? formatVisitedAt(spot.departedAt) : '—'}`
          : null

      return {
        id: spot.spotId,
        type: spot.type,
        name: spot.name,
        memo: stayInfo
          ? [spot.memo, stayInfo].filter((v) => v !== null).join('\n')
          : spot.memo,
        latitude: spot.latitude,
        longitude: spot.longitude,
        primaryTime: { label: '予定', value: spot.plannedArrivalAt },
        secondaryTime: spot.isSkipped
          ? { label: 'スキップ', value: spot.skippedAt }
          : { label: '実績', value: spot.arrivedAt },
        isSkipped: spot.isSkipped,
        travelLink: travelLinks.get(spot.spotId) ?? null,
        onEdit: () => setEditingSpot(spot),
      }
    }),
    ...(showDestination
      ? [
          {
            id: 'destination',
            type: 'DESTINATION' as const,
            name: '終着地',
            latitude: touring?.endLatitude,
            longitude: touring?.endLongitude,
            onEdit: () => setEditingLocationTarget('end'),
          },
        ]
      : []),
  ]

  const spotsCard = (
    <div className={styles.card}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">スポット・休憩</h2>
        <button
          onClick={() => setAddModalType('SPOT')}
          className={styles.editButton}
          aria-label="スポットを追加"
          title="スポット・休憩を追加"
        >
          ＋
        </button>
      </div>

      {touring?.status === 'STARTED' && (
        <div className="mb-4">
          {currentBreak ? (
            <div className={styles.breakBanner}>
              <span className={styles.breakBannerText}>
                休憩中 {formatVisitedAt(currentBreak.arrivedAt)}〜
              </span>
              <button
                onClick={handleQuickBreakEnd}
                disabled={isBreakLoading}
                className={styles.breakEndButton}
              >
                休憩終了
              </button>
            </div>
          ) : (
            <button
              onClick={handleQuickBreakStart}
              disabled={isBreakLoading}
              className={styles.breakStartButton}
            >
              休憩を始める
            </button>
          )}
        </div>
      )}

      {spotsLoading ? (
        <p className={`text-sm ${styles.mutedText}`}>読み込み中...</p>
      ) : (
        <RouteTimeline
          items={timelineItems}
          sortableIds={localSpots.map((s) => s.spotId)}
          onReorder={handleReorder}
          emptyMessage="スポットはまだ記録されていません"
        />
      )}
    </div>
  )

  const statusLabel = touring?.status === 'STARTED' ? '進行中' : '完了'
  const statusBadgeClass =
    touring?.status === 'STARTED'
      ? styles.statusStarted
      : styles.statusCompleted

  return (
    <>
      <div
        className={`w-full flex flex-row items-start gap-3 mb-4 ${hasMap ? 'max-w-5xl' : 'max-w-md'}`}
      >
        <div className="shrink-0 pt-0.5">
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}/tourings`)}
            variant="cloud"
          >
            ← 戻る
          </Button>
        </div>
        {touring && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold truncate">{touring.title}</h1>
              <span className={statusBadgeClass}>{statusLabel}</span>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className={styles.editButton}
                aria-label="編集"
              >
                <EditIcon />
              </button>
              <button
                onClick={() => setIsFuelLogLinkModalOpen(true)}
                className={styles.editButton}
                aria-label="給油履歴の紐づけ"
                title="給油履歴の紐づけ"
              >
                <FuelIcon />
              </button>
            </div>
            <p className={`text-xs mt-1 ${styles.mutedText}`}>
              {formatDate(touring.startDate)} → {formatDate(touring.endDate)}
              {distance !== null && ` · ${distance.toLocaleString()}km`}
            </p>
            {touring.touringPlanId !== null && (
              <Link
                href={`/app/my-bike/${bikeId}/touring-plans/${touring.touringPlanId}`}
                className={`${styles.routeLink} mt-1`}
              >
                このツーリングは元プランから開始されました →
              </Link>
            )}
          </div>
        )}
      </div>

      {hasMap ? (
        <div className="w-full max-w-5xl flex flex-col md:flex-row md:gap-6 md:items-start gap-4">
          <div className="md:flex-1 min-w-0">
            <div className={styles.mapStickyWrapper}>
              <div className={styles.card}>
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
          </div>
          <div className="md:w-80 lg:w-96 shrink-0 space-y-4">
            {spotsCard}
            {isAdmin && (
              <TouringPhotosCard
                touringId={touringId}
                cardClassName={styles.card}
                mutedTextClassName={styles.mutedText}
                editButtonClassName={styles.editButton}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-4">
          {spotsCard}
          {isAdmin && (
            <TouringPhotosCard
              touringId={touringId}
              cardClassName={styles.card}
              mutedTextClassName={styles.mutedText}
              editButtonClassName={styles.editButton}
            />
          )}
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

      {isFuelLogLinkModalOpen && (
        <TouringFuelLogLinkModal
          bikeId={bikeId}
          touringId={touringId}
          onClose={() => setIsFuelLogLinkModalOpen(false)}
          onSuccess={() => setIsFuelLogLinkModalOpen(false)}
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
          onDelete={handleSpotDeleteSuccess}
        />
      )}

      {addModalType !== null && (
        <SpotAddModal
          bikeId={bikeId}
          touringId={touringId}
          initialType={addModalType}
          prevSpotDepartedAt={
            localSpots.length > 0
              ? (localSpots.at(-1)!.departedAt ??
                localSpots.at(-1)!.arrivedAt ??
                undefined)
              : undefined
          }
          onClose={() => setAddModalType(null)}
          onSuccess={handleSpotAddSuccess}
        />
      )}
    </>
  )
}

export default withAuth(TouringDetailPage)
