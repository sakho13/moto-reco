'use client'

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, Fragment } from 'react'
import useSWR, { mutate } from 'swr'
import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import styles from './page.module.css'
import { ModalBase } from '@/components/common/ModalBase'
import { EditIcon } from '@/components/icons/EditIcon'
import { SortableSpotItem } from '@/components/spot/SortableSpotItem'
import { SpotAddModal } from '@/components/spot/SpotAddModal'
import { SpotEditModal } from '@/components/spot/SpotEditModal'
import { TouringEditModal } from '@/components/touring/TouringEditModal'
import { TouringLocationEditModal } from '@/components/touring/TouringLocationEditModal'
import TouringRouteMap from '@/components/touring/TouringRouteMap'
import type { MapPoint } from '@/components/touring/TouringRouteMap'
import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import {
  buildGoogleMapsRouteUrl,
  buildGoogleMapsTwoPointUrl,
} from '@/lib/utils/googleMaps'

function TouringDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bikeId = params.id as string
  const touringId = params.touringId as string
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isStartConfirmOpen, setIsStartConfirmOpen] = useState(false)
  const { getCurrentPosition } = useGeolocation()
  const [editingLocationTarget, setEditingLocationTarget] = useState<
    'start' | 'end' | null
  >(null)
  const [editingSpot, setEditingSpot] = useState<ApiResponseSpotDetail | null>(
    null
  )
  const [addModalType, setAddModalType] = useState<'SPOT' | 'BREAK' | null>(
    null
  )
  const [mapClickLocation, setMapClickLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [localSpots, setLocalSpots] = useState<ApiResponseSpotDetail[]>([])
  const [isBreakLoading, setIsBreakLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
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

  useEffect(() => {
    if (spots) {
      setLocalSpots(spots)
    }
  }, [spots])

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

  const calcTravelMinutes = (
    departStr: string | null | undefined,
    arriveStr: string | null | undefined
  ): number | null => {
    if (!departStr || !arriveStr) return null
    const diff = Math.round(
      (new Date(arriveStr).getTime() - new Date(departStr).getTime()) / 60000
    )
    return diff > 0 ? diff : null
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localSpots.findIndex((s) => s.spotId === active.id)
    const newIndex = localSpots.findIndex((s) => s.spotId === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(localSpots, oldIndex, newIndex)
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
      setLocalSpots(localSpots)
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

  if (
    (touring?.status === 'COMPLETED' || touring?.status === 'PLANNED') &&
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

  const handleStartFromPlan = async () => {
    setIsStarting(true)
    try {
      const { position } = await getCurrentPosition()
      await apiPost(
        `/api/v1/user-bike/bike/${bikeId}/tourings/start-end` as const,
        {
          action: 'start',
          touringPlanId: touringId,
          startDate: new Date().toISOString(),
          startLatitude: position?.latitude,
          startLongitude: position?.longitude,
        }
      )
      toast.success('ツーリングを開始しました')
      await mutate('/api/v1/user-bike/bikes/ongoing-tourings')
      router.push('/app/home')
    } catch (err) {
      toast.error(
        err instanceof ApiV1Error
          ? err.message
          : 'ツーリングの開始に失敗しました'
      )
    } finally {
      setIsStarting(false)
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
    setMapClickLocation(null)
  }

  const handleMapClick = (lat: number, lng: number) => {
    setMapClickLocation({ lat, lng })
    setAddModalType('SPOT')
  }

  const handleSpotDeleteSuccess = async () => {
    await _mutateTouringAndSpots()
    setEditingSpot(null)
  }

  const currentBreak =
    localSpots.find((s) => s.type === 'BREAK' && s.endAt === null) ?? null

  const handleQuickBreakStart = async () => {
    setIsBreakLoading(true)
    try {
      await apiPost(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`,
        { type: 'BREAK', visitedAt: new Date() }
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
        { endAt: new Date() }
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

  const hasMap = mapPoints.length > 0 || touring?.status === 'PLANNED'
  const googleMapsUrl = buildGoogleMapsRouteUrl(mapPoints)

  const startLocation =
    touring?.startLatitude != null && touring?.startLongitude != null
      ? { lat: touring.startLatitude, lng: touring.startLongitude }
      : null

  const endLocation =
    touring?.endLatitude != null && touring?.endLongitude != null
      ? { lat: touring.endLatitude, lng: touring.endLongitude }
      : null

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
                休憩中 {formatVisitedAt(currentBreak.visitedAt)}〜
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
        <div className={styles.spotsListScroll}>
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
                    {startLocation.lat.toFixed(5)},{' '}
                    {startLocation.lng.toFixed(5)}
                  </p>
                ) : (
                  <p className={`text-xs mt-1 ${styles.mutedText}`}>
                    位置未設定
                  </p>
                )}
              </div>
            </div>

            {/* 出発地 → スポット1 ルートリンク */}
            {startLocation != null &&
              localSpots[0]?.latitude != null &&
              localSpots[0]?.longitude != null && (
                <a
                  href={buildGoogleMapsTwoPointUrl(startLocation, {
                    lat: localSpots[0]!.latitude!,
                    lng: localSpots[0]!.longitude!,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.routeLink}
                >
                  ↓ Googleマップで経路確認
                  {(() => {
                    const min = calcTravelMinutes(
                      touring?.startDate,
                      localSpots[0]?.visitedAt
                    )
                    return min !== null ? `（移動 ${min}分）` : ''
                  })()}
                </a>
              )}

            {/* 立ち寄りスポット（DnD） */}
            {localSpots && localSpots.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localSpots.map((s) => s.spotId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {localSpots.map((spot, index) => {
                      const nextSpot = localSpots[index + 1]
                      return (
                        <Fragment key={spot.spotId}>
                          <SortableSpotItem
                            spot={spot}
                            index={index}
                            editButtonClassName={styles.editButton}
                            spotItemClassName={styles.spotItem}
                            spotBadgeClassName={styles.spotBadge}
                            mutedTextClassName={styles.mutedText}
                            dimTextClassName={styles.dimText}
                            formatVisitedAt={formatVisitedAt}
                            touringStatus={touring?.status}
                            onEdit={setEditingSpot}
                          />
                          {nextSpot &&
                            spot.latitude != null &&
                            spot.longitude != null &&
                            nextSpot.latitude != null &&
                            nextSpot.longitude != null && (
                              <a
                                href={buildGoogleMapsTwoPointUrl(
                                  { lat: spot.latitude, lng: spot.longitude },
                                  {
                                    lat: nextSpot.latitude,
                                    lng: nextSpot.longitude,
                                  }
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.routeLink}
                              >
                                ↓ Googleマップで経路確認
                                {(() => {
                                  const min = calcTravelMinutes(
                                    spot.endAt,
                                    nextSpot.visitedAt
                                  )
                                  return min !== null ? `（移動 ${min}分）` : ''
                                })()}
                              </a>
                            )}
                        </Fragment>
                      )
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* スポットがない場合のメッセージ */}
            {(!localSpots || localSpots.length === 0) && (
              <p className={`text-sm ${styles.mutedText}`}>
                スポットはまだ記録されていません
              </p>
            )}

            {/* 最終スポット → 終着地 ルートリンク */}
            {(touring?.status === 'COMPLETED' ||
              touring?.status === 'PLANNED') &&
              endLocation != null &&
              localSpots.at(-1)?.latitude != null &&
              localSpots.at(-1)?.longitude != null && (
                <a
                  href={buildGoogleMapsTwoPointUrl(
                    {
                      lat: localSpots.at(-1)!.latitude!,
                      lng: localSpots.at(-1)!.longitude!,
                    },
                    endLocation
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.routeLink}
                >
                  ↓ Googleマップで経路確認
                  {(() => {
                    const min = calcTravelMinutes(
                      localSpots.at(-1)?.endAt,
                      touring?.endDate
                    )
                    return min !== null ? `（移動 ${min}分）` : ''
                  })()}
                </a>
              )}

            {/* 終着地（COMPLETED・PLANNEDの場合に表示） */}
            {(touring?.status === 'COMPLETED' ||
              touring?.status === 'PLANNED') && (
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
        </div>
      )}
    </div>
  )

  const statusLabel =
    touring?.status === 'PLANNED'
      ? 'プラン'
      : touring?.status === 'STARTED'
        ? '進行中'
        : '完了'
  const statusBadgeClass =
    touring?.status === 'PLANNED'
      ? styles.statusPlanned
      : touring?.status === 'STARTED'
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
            </div>
            <p className={`text-xs mt-1 ${styles.mutedText}`}>
              {formatDate(touring.startDate)} → {formatDate(touring.endDate)}
              {distance !== null && ` · ${distance.toLocaleString()}km`}
            </p>
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
                    onMapClick={
                      touring?.status === 'PLANNED' ? handleMapClick : undefined
                    }
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
                {touring?.status === 'PLANNED' && (
                  <p className={styles.mapClickHint}>
                    地図をタップしてスポットを追加
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="md:w-80 lg:w-96 shrink-0 space-y-4">
            {touring?.status === 'PLANNED' && (
              <Button
                onClick={() => setIsStartConfirmOpen(true)}
                variant="primary"
                fullWidth
                disabled={isStarting}
              >
                {isStarting ? '開始中...' : 'ツーリングを開始する'}
              </Button>
            )}
            {spotsCard}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-4">
          {touring?.status === 'PLANNED' && (
            <Button
              onClick={() => setIsStartConfirmOpen(true)}
              variant="primary"
              fullWidth
              disabled={isStarting}
            >
              {isStarting ? '開始中...' : 'ツーリングを開始する'}
            </Button>
          )}
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
          touringStatus={touring?.status}
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
          initialLocation={mapClickLocation}
          touringStatus={touring?.status}
          prevSpotVisitedAt={
            touring?.status === 'PLANNED' && localSpots.length > 0
              ? (localSpots.at(-1)!.endAt ??
                localSpots.at(-1)!.plannedAt ??
                localSpots.at(-1)!.visitedAt ??
                undefined)
              : undefined
          }
          onClose={() => {
            setAddModalType(null)
            setMapClickLocation(null)
          }}
          onSuccess={handleSpotAddSuccess}
        />
      )}

      {isStartConfirmOpen && touring && (
        <ModalBase
          title="ツーリングを開始する"
          onClose={() => setIsStartConfirmOpen(false)}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm">
              予定日:{' '}
              <strong>
                {new Date(touring.startDate).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </strong>
            </p>
            <p className="text-sm opacity-60">
              今すぐ開始すると、現在地と現在時刻でツーリングが記録されます。
            </p>
            <div className="flex gap-3">
              <Button
                variant="cloud"
                fullWidth
                onClick={() => setIsStartConfirmOpen(false)}
                disabled={isStarting}
              >
                キャンセル
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={async () => {
                  setIsStartConfirmOpen(false)
                  await handleStartFromPlan()
                }}
                disabled={isStarting}
                loading={isStarting}
              >
                開始する
              </Button>
            </div>
          </div>
        </ModalBase>
      )}
    </>
  )
}

export default withAuth(TouringDetailPage)
