'use client'

import { ExternalLink } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { getCurrentDate } from '@repo/shared-utils'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import styles from './page.module.css'
import { FuelIcon } from '@/components/icons/FuelIcon'
import { PhotoViewerModal } from '@/components/photo/PhotoViewerModal'
import { TouringPhotosCard } from '@/components/photo/TouringPhotosCard'
import { SpotAddModal } from '@/components/spot/SpotAddModal'
import { SpotEditModal } from '@/components/spot/SpotEditModal'
import { TouringDetailEditor } from '@/components/touring/TouringDetailEditor'
import { TouringDetailHero } from '@/components/touring/TouringDetailHero'
import { TouringEditModal } from '@/components/touring/TouringEditModal'
import { TouringFuelLogLinkModal } from '@/components/touring/TouringFuelLogLinkModal'
import { TouringJourney } from '@/components/touring/TouringJourney'
import { TouringLocationEditModal } from '@/components/touring/TouringLocationEditModal'
import { TouringMapPanel } from '@/components/touring/TouringMapPanel'
import TouringRouteMap from '@/components/touring/TouringRouteMap'
import type { MapPoint } from '@/components/touring/TouringRouteMap'
import { trackEvent } from '@/lib/analytics'
import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'
import { useMapPanel } from '@/lib/hooks/useMapPanel'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useTouringSpotPhotos } from '@/lib/hooks/useTouringSpotPhotos'
import { canUsePhotos } from '@/lib/utils/photoAccess'
import {
  buildJourney,
  formatClock,
  formatTouringDate,
} from '@/lib/utils/touringJourney'

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'

function TouringDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bikeId = params.id as string
  const touringId = params.touringId as string
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const mapPanel = useMapPanel(isDesktop)
  const [isEditing, setIsEditing] = useState(false)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [now, setNow] = useState(getCurrentDate)
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
  const [viewingPhoto, setViewingPhoto] = useState<{
    nodeId: string
    index: number
  } | null>(null)

  const { data: profile } = useSWR('/api/v1/user/profile', async (url) => {
    const response = await apiGet(url)
    return response.data
  })
  const showsPhotos = canUsePhotos(profile?.role)
  const { photosBySpotId } = useTouringSpotPhotos(touringId, showsPhotos)

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

  const isStarted = touring?.status === 'STARTED'

  useEffect(() => {
    if (!isStarted) return
    const timer = setInterval(() => setNow(getCurrentDate()), 60_000)
    return () => clearInterval(timer)
  }, [isStarted])

  const journey = useMemo(
    () => (touring ? buildJourney(touring, localSpots) : null),
    [touring, localSpots]
  )

  const mapPoints = useMemo<MapPoint[]>(
    () =>
      (journey?.nodes ?? []).flatMap((node) =>
        node.point
          ? [
              {
                lat: node.point.lat,
                lng: node.point.lng,
                label: node.name,
                type: node.isPending ? 'pending' : node.kind,
                id: node.id,
                mark: node.mark,
              },
            ]
          : []
      ),
    [journey]
  )

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
      <div className={styles.root}>
        <div>
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}/tourings`)}
            variant="cloud"
          >
            ← 戻る
          </Button>
        </div>
        <div className={styles.card}>
          <h1 className={`text-2xl font-bold mb-4 ${styles.errorTitle}`}>
            エラー
          </h1>
          <p className={`mb-4 ${styles.bodyText}`}>
            {touringError instanceof ApiV1Error
              ? touringError.message
              : 'ツーリング情報の取得に失敗しました'}
          </p>
        </div>
      </div>
    )
  }

  if (!touring || !journey) return null

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
      trackEvent('touring_break_start')
      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`
      ).catch(() => {})
      toast.success('休憩を開始しました')
    } catch (err) {
      trackEvent('touring_error', {
        operation: 'break_start',
        ...(err instanceof ApiV1Error
          ? { error_code: err.errorCode, error_message: err.message }
          : {}),
      })
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
      trackEvent('touring_break_end')
      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`
      ).catch(() => {})
      toast.success('休憩を終了しました')
    } catch (err) {
      trackEvent('touring_error', {
        operation: 'break_end',
        ...(err instanceof ApiV1Error
          ? { error_code: err.errorCode, error_message: err.message }
          : {}),
      })
      toast.error(
        err instanceof ApiV1Error ? err.message : '休憩の終了に失敗しました'
      )
    } finally {
      setIsBreakLoading(false)
    }
  }

  const openMap = (nodeId: string | null) => {
    setFocusedId(nodeId)
    if (isDesktop) return
    mapPanel.open()
  }

  const hasMap = mapPoints.length > 0
  const viewingPhotos = viewingPhoto
    ? photosBySpotId.get(viewingPhoto.nodeId)
    : undefined
  const viewingNodeName =
    journey.nodes.find((node) => node.id === viewingPhoto?.nodeId)?.name ?? ''
  const backHref = `/app/my-bike/${bikeId}/tourings`
  const planHref =
    touring.touringPlanId !== null
      ? `/app/my-bike/${bikeId}/touring-plans/${touring.touringPlanId}`
      : null
  const fuelLogCount = touring.fuelLogIds.length
  const fuelLogLabel = `給油履歴の紐づけ${fuelLogCount > 0 ? ` ${fuelLogCount}件` : ''}`

  const isMultiDay =
    new Date(touring.startDate).toDateString() !==
    new Date(touring.endDate).toDateString()
  const journeyHeading = isStarted
    ? 'ここまでの道のり'
    : isMultiDay
      ? 'この旅の道のり'
      : 'この日の道のり'

  const distanceLabel =
    journey.distance !== null
      ? ` ・ ${journey.distance.toLocaleString()}km`
      : ''

  const startLocation =
    touring.startLatitude != null && touring.startLongitude != null
      ? { lat: touring.startLatitude, lng: touring.startLongitude }
      : null

  const endLocation =
    touring.endLatitude != null && touring.endLongitude != null
      ? { lat: touring.endLatitude, lng: touring.endLongitude }
      : null

  return (
    <div className={styles.root}>
      {!isEditing && (
        <TouringDetailHero
          touring={touring}
          journey={journey}
          now={now}
          backHref={backHref}
          planHref={planHref}
          onEdit={() => setIsEditing(true)}
          onOpenMap={!isDesktop && hasMap ? () => openMap(null) : undefined}
          headerActions={
            isDesktop ? (
              <Button
                type="button"
                variant="cloud"
                onClick={() => setIsFuelLogLinkModalOpen(true)}
              >
                {fuelLogLabel}
              </Button>
            ) : null
          }
        >
          {isStarted && (
            <div className={styles.liveActions}>
              {currentBreak ? (
                <div className={styles.breakBanner}>
                  <span className={styles.breakBannerText}>
                    休憩中{' '}
                    {currentBreak.arrivedAt
                      ? `${formatClock(currentBreak.arrivedAt)}〜`
                      : ''}
                  </span>
                  <Button
                    type="button"
                    variant="warning"
                    className={styles.breakEndButton}
                    onClick={handleQuickBreakEnd}
                    disabled={isBreakLoading}
                  >
                    休憩終了
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="warning"
                  fullWidth
                  onClick={handleQuickBreakStart}
                  disabled={isBreakLoading}
                >
                  休憩を始める
                </Button>
              )}
              <Button
                type="button"
                variant="cloud"
                fullWidth
                onClick={() => setAddModalType('SPOT')}
              >
                ＋ スポットを追加
              </Button>
            </div>
          )}
        </TouringDetailHero>
      )}

      <div
        className={`${styles.layout} ${isDesktop && hasMap ? styles.layoutWithMap : ''}`}
      >
        <div className={styles.column}>
          {isEditing ? (
            <TouringDetailEditor
              title={touring.title}
              subtitle={`${formatTouringDate(touring)}${distanceLabel}`}
              fuelLogLabel={fuelLogLabel}
              journey={journey}
              sortableIds={localSpots.map((s) => s.spotId)}
              isLoadingSpots={spotsLoading}
              onFinish={() => setIsEditing(false)}
              onEditTouring={() => setIsEditModalOpen(true)}
              onLinkFuelLogs={() => setIsFuelLogLinkModalOpen(true)}
              onReorder={handleReorder}
              onEditLocation={setEditingLocationTarget}
              onEditSpot={setEditingSpot}
              onAddSpot={setAddModalType}
            />
          ) : (
            <>
              <section>
                <h2 className={styles.sectionTitle}>{journeyHeading}</h2>
                {spotsLoading ? (
                  <p className={styles.mutedText}>読み込み中...</p>
                ) : (
                  <TouringJourney
                    journey={journey}
                    now={now}
                    focusedId={isDesktop ? focusedId : null}
                    onShowOnMap={openMap}
                    onAddSpot={() => setAddModalType('SPOT')}
                    photosBySpotId={showsPhotos ? photosBySpotId : undefined}
                    onOpenPhoto={(nodeId, index) =>
                      setViewingPhoto({ nodeId, index })
                    }
                  />
                )}
              </section>

              {showsPhotos && (
                <TouringPhotosCard
                  touringId={touringId}
                  cardClassName={styles.photos}
                  mutedTextClassName={styles.mutedText}
                />
              )}

              {!isDesktop && (
                <div className={styles.links}>
                  <button
                    type="button"
                    className={styles.linkRow}
                    onClick={() => setIsFuelLogLinkModalOpen(true)}
                  >
                    <FuelIcon />
                    <span className={styles.linkRowLabel}>{fuelLogLabel}</span>
                  </button>
                  {journey.routeUrl && (
                    <a
                      className={styles.linkRow}
                      href={journey.routeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={20} aria-hidden="true" />
                      <span className={styles.linkRowLabel}>
                        Googleマップで経路を表示
                      </span>
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {isDesktop && hasMap && (
          <aside className={styles.mapAside}>
            <div className={styles.mapFrame}>
              <TouringRouteMap
                points={mapPoints}
                containerClassName={styles.mapContainer}
                focusedId={focusedId}
                onPointClick={setFocusedId}
              />
            </div>
            {journey.routeUrl && (
              <a
                className={styles.routeLink}
                href={journey.routeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Googleマップで経路を表示
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            )}
          </aside>
        )}
      </div>

      {!isDesktop && mapPanel.isOpen && (
        <TouringMapPanel
          journey={journey}
          points={mapPoints}
          focusedId={focusedId}
          onFocus={setFocusedId}
          onClose={mapPanel.close}
        />
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
          showsPhotos={showsPhotos}
          onClose={() => setEditingSpot(null)}
          onSuccess={handleSpotEditSuccess}
          onDelete={handleSpotDeleteSuccess}
        />
      )}

      {viewingPhoto && viewingPhotos && (
        <PhotoViewerModal
          title={`${viewingNodeName}の写真`}
          photos={viewingPhotos}
          initialIndex={viewingPhoto.index}
          onClose={() => setViewingPhoto(null)}
        />
      )}

      {addModalType !== null && (
        <SpotAddModal
          bikeId={bikeId}
          touringId={touringId}
          initialType={addModalType}
          prevSpotDepartedAt={
            isStarted
              ? undefined
              : (localSpots.at(-1)?.departedAt ??
                localSpots.at(-1)?.arrivedAt ??
                touring.startDate)
          }
          onClose={() => setAddModalType(null)}
          onSuccess={handleSpotAddSuccess}
        />
      )}
    </div>
  )
}

export default withAuth(TouringDetailPage)
