'use client'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import { getCurrentDate } from '@repo/shared-utils'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import styles from './page.module.css'
import { ModalBase } from '@/components/common/ModalBase'
import { HistorySummaryCard } from '@/components/touring/HistorySummaryCard'
import { PlanEditModal } from '@/components/touring/PlanEditModal'
import { PlanLocationEditModal } from '@/components/touring/PlanLocationEditModal'
import { PlanSpotAddModal } from '@/components/touring/PlanSpotAddModal'
import { PlanSpotEditModal } from '@/components/touring/PlanSpotEditModal'
import type { RouteTimelineItem } from '@/components/touring/RouteTimeline'
import { RouteTimeline } from '@/components/touring/RouteTimeline'
import { TouringMapPanel } from '@/components/touring/TouringMapPanel'
import { TouringPlanHero } from '@/components/touring/TouringPlanHero'
import { TouringPlanJourney } from '@/components/touring/TouringPlanJourney'
import TouringRouteMap from '@/components/touring/TouringRouteMap'
import type { MapPoint } from '@/components/touring/TouringRouteMap'
import { trackEvent } from '@/lib/analytics'
import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { useMapPanel } from '@/lib/hooks/useMapPanel'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import type { JourneyNode } from '@/lib/utils/touringJourney'
import {
  buildPlanJourney,
  formatPlanStayTime,
} from '@/lib/utils/touringPlanJourney'

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'
const HISTORY_SECTION_ID = 'plan-history'
const MIN_STOPS_TO_REORDER = 2

const toLatLng = (
  location: { latitude: number | null; longitude: number | null } | null
): { lat: number; lng: number } | null =>
  location?.latitude != null && location.longitude != null
    ? { lat: location.latitude, lng: location.longitude }
    : null

const toTimelineItem = (node: JourneyNode): RouteTimelineItem => {
  const base = { id: node.id, name: node.name, mark: node.mark }
  switch (node.kind) {
    case 'start':
      return { ...base, type: 'START' }
    case 'end':
      return { ...base, type: 'DESTINATION' }
    case 'break':
      return { ...base, type: 'BREAK' }
    default:
      return { ...base, type: 'SPOT' }
  }
}

function TouringPlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bikeId = params.id as string
  const planId = params.planId as string
  const { getCurrentPosition } = useGeolocation()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const mapPanel = useMapPanel(isDesktop)

  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingLocationTarget, setEditingLocationTarget] = useState<
    'start' | 'destination' | null
  >(null)
  const [addModalType, setAddModalType] = useState<'SPOT' | 'BREAK' | null>(
    null
  )
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null)
  const [isStartConfirmOpen, setIsStartConfirmOpen] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [mapClickLocation, setMapClickLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)

  const listUrl = `/api/v1/user-bike/bike/${bikeId}/touring-plans`
  const detailUrl = `${listUrl}/${planId}`
  const spotsUrl = `${detailUrl}/spots`

  const {
    data: plan,
    error: planError,
    isLoading: planLoading,
  } = useSWR(bikeId && planId ? detailUrl : null, async (url) => {
    const response = await apiGet(
      url as `/api/v1/user-bike/bike/${string}/touring-plans/${string}`
    )
    return response.data
  })

  const {
    data: spots,
    error: spotsError,
    isLoading: spotsLoading,
  } = useSWR(bikeId && planId ? spotsUrl : null, async (url) => {
    const response = await apiGet(
      url as `/api/v1/user-bike/bike/${string}/touring-plans/${string}/spots`
    )
    return response.data
  })

  const touringIds = plan?.touringIds ?? []

  const { data: tourings, isLoading: touringsLoading } = useSWR(
    bikeId && touringIds.length > 0
      ? [`/api/v1/user-bike/bike/${bikeId}/tourings`, ...touringIds]
      : null,
    async ([, ...ids]) => {
      const results = await Promise.all(
        (ids as string[]).map(async (touringId) => {
          const response = await apiGet(
            `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}` as `/api/v1/user-bike/bike/${string}/tourings/${string}`
          )
          return response.data
        })
      )
      return results
    }
  )

  const journey = useMemo(
    () => (plan ? buildPlanJourney(plan, spots ?? []) : null),
    [plan, spots]
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
                type: node.kind,
                id: node.id,
                mark: node.mark,
              },
            ]
          : []
      ),
    [journey]
  )

  const backHref = `/app/my-bike/${bikeId}/touring-plans`

  if (planLoading) {
    return (
      <div className={styles.root}>
        <p className={styles.loading}>読み込み中...</p>
      </div>
    )
  }

  if (planError || !plan || !journey) {
    return (
      <div className={styles.root}>
        <Link href={backHref} className={styles.backLink}>
          ‹ 一覧へ
        </Link>
        <div className={styles.errorBox}>
          <h1 className={styles.errorTitle}>エラー</h1>
          <p className={styles.errorMessage}>
            {planError instanceof ApiV1Error
              ? planError.message
              : 'ツーリングプランの取得に失敗しました'}
          </p>
        </div>
      </div>
    )
  }

  const middleSpots = (spots ?? []).filter(
    (spot) => spot.type === 'SPOT' || spot.type === 'BREAK'
  )
  const sortableIds = middleSpots.map((spot) => spot.touringPlanSpotId)
  const editingSpot = spots?.find(
    (spot) => spot.touringPlanSpotId === editingSpotId
  )
  const editingSpotIndex = middleSpots.findIndex(
    (spot) => spot.touringPlanSpotId === editingSpotId
  )
  const startLatLng = toLatLng(plan.startLocation)
  const lastStopLatLng = toLatLng(middleSpots.at(-1) ?? plan.startLocation)
  const editSpotPrevLocation =
    editingSpotIndex > 0
      ? toLatLng(middleSpots[editingSpotIndex - 1] ?? null)
      : startLatLng

  const handleReorder = async (newOrderIds: string[]) => {
    const previous = spots
    const reordered = previous && [
      ...previous.filter((spot) => spot.type === 'START'),
      ...newOrderIds.flatMap((id) =>
        previous.filter((spot) => spot.touringPlanSpotId === id)
      ),
      ...previous.filter((spot) => spot.type === 'DESTINATION'),
    ]
    await mutate(spotsUrl, reordered, { revalidate: false })

    try {
      await apiPatch(
        `${spotsUrl}/reorder` as `/api/v1/user-bike/bike/${string}/touring-plans/${string}/spots/reorder`,
        { spotIds: newOrderIds }
      )
    } catch (err) {
      await mutate(spotsUrl, previous, { revalidate: false })
      toast.error(
        err instanceof ApiV1Error ? err.message : '並び替えに失敗しました'
      )
      return
    }
    await Promise.all([
      mutate(spotsUrl),
      mutate(detailUrl),
      mutate(listUrl),
    ]).catch(() => {})
  }

  const handleEditSuccess = async (action: 'update' | 'delete') => {
    if (action === 'delete') {
      router.push(backHref)
    } else {
      setIsEditModalOpen(false)
    }
  }

  const handleEditNode = (nodeId: string) => {
    if (nodeId === 'start' || nodeId === 'destination') {
      setEditingLocationTarget(nodeId)
    } else {
      setEditingSpotId(nodeId)
    }
  }

  const handleShowOnMap = (nodeId: string) => {
    setFocusedId(nodeId)
    if (!isDesktop) mapPanel.open()
  }

  const handleMapClick = (lat: number, lng: number) => {
    setMapClickLocation({ lat, lng })
    setAddModalType('SPOT')
    if (mapPanel.isOpen) mapPanel.close()
  }

  const handleStart = async () => {
    setIsStarting(true)
    try {
      const { position } = await getCurrentPosition()
      await apiPost(`/api/v1/user-bike/bike/${bikeId}/tourings/start-end`, {
        action: 'start',
        touringPlanId: planId,
        startDate: getCurrentDate().toISOString(),
        startLatitude: position?.latitude,
        startLongitude: position?.longitude,
      })
      trackEvent('touring_start', {
        from_touring_plan: true,
        has_position: position != null,
      })
      toast.success('ツーリングを開始しました')
      await mutate('/api/v1/user-bike/bikes/ongoing-tourings').catch(() => {})
      router.push('/app/home')
    } catch (err) {
      trackEvent('touring_error', {
        operation: 'start',
        ...(err instanceof ApiV1Error
          ? { error_code: err.errorCode, error_message: err.message }
          : {}),
      })
      toast.error(
        err instanceof ApiV1Error
          ? err.message
          : 'ツーリングの開始に失敗しました'
      )
    } finally {
      setIsStarting(false)
      setIsStartConfirmOpen(false)
    }
  }

  const renderRoute = () => {
    if (spotsLoading) return <p className={styles.muted}>読み込み中...</p>
    if (spotsError) {
      return <p className={styles.muted}>地点の取得に失敗しました</p>
    }
    if (isReordering) {
      return (
        <>
          <p className={styles.reorderNote}>
            つまみをドラッグして順番を変えられます。移動時間は変わらないので、順番を変えたら区間ごとに見直してください。
          </p>
          <RouteTimeline
            items={journey.nodes.map(toTimelineItem)}
            sortableIds={sortableIds}
            onReorder={handleReorder}
            isScrollable={false}
          />
        </>
      )
    }
    return (
      <TouringPlanJourney
        journey={journey}
        focusedId={isDesktop ? focusedId : null}
        onShowOnMap={handleShowOnMap}
        onEditNode={handleEditNode}
        onAddStop={setAddModalType}
      />
    )
  }

  return (
    <div className={styles.root}>
      <TouringPlanHero
        plan={plan}
        journey={journey}
        backHref={backHref}
        hasLoadedStops={spots !== undefined}
        onShowHistory={() =>
          document
            .getElementById(HISTORY_SECTION_ID)
            ?.scrollIntoView({ behavior: 'smooth' })
        }
        onEdit={() => setIsEditModalOpen(true)}
        onOpenMap={!isDesktop ? mapPanel.open : undefined}
      >
        <div className={styles.startAction}>
          <Button
            type="button"
            variant="primary"
            fullWidth
            disabled={isStarting}
            onClick={() => setIsStartConfirmOpen(true)}
          >
            {isStarting ? '開始中...' : 'このプランで開始する'}
          </Button>
        </div>
      </TouringPlanHero>

      <div
        className={`${styles.layout} ${isDesktop ? styles.layoutWithMap : ''}`}
      >
        <div className={styles.column}>
          <section>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>道のり</h2>
              {sortableIds.length >= MIN_STOPS_TO_REORDER && (
                <Button
                  type="button"
                  variant={isReordering ? 'primary' : 'cloud'}
                  size="sm"
                  className={styles.touchTarget}
                  aria-pressed={isReordering}
                  onClick={() => setIsReordering((current) => !current)}
                >
                  {isReordering ? '並び替えを終える' : '順番を変える'}
                </Button>
              )}
            </div>
            {renderRoute()}
          </section>

          {touringIds.length > 0 && (
            <section id={HISTORY_SECTION_ID} className={styles.history}>
              <h2 className={styles.sectionTitle}>このプランの走行記録</h2>
              {touringsLoading ? (
                <p className={styles.muted}>読み込み中...</p>
              ) : (
                tourings?.map((touring) => (
                  <HistorySummaryCard
                    key={touring.touringId}
                    touring={touring}
                    onClick={(touringId) =>
                      router.push(
                        `/app/my-bike/${bikeId}/tourings/${touringId}`
                      )
                    }
                  />
                ))
              )}
            </section>
          )}
        </div>

        {isDesktop && (
          <aside className={styles.mapAside}>
            <div className={styles.mapFrame}>
              <TouringRouteMap
                points={mapPoints}
                containerClassName={styles.mapContainer}
                focusedId={focusedId}
                onPointClick={setFocusedId}
                onMapClick={handleMapClick}
              />
            </div>
            <div className={styles.mapFooter}>
              <p className={styles.mapHint}>
                地図をクリックするとスポットを追加できます
              </p>
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
            </div>
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
          onMapClick={handleMapClick}
          mapHint="地図をタップするとスポットを追加できます"
          getNodeTime={formatPlanStayTime}
        />
      )}

      {isEditModalOpen && (
        <PlanEditModal
          bikeId={bikeId}
          planId={planId}
          plan={plan}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {editingLocationTarget && (
        <PlanLocationEditModal
          bikeId={bikeId}
          planId={planId}
          type={editingLocationTarget}
          initialLocation={
            editingLocationTarget === 'start'
              ? plan.startLocation
              : plan.destinationLocation
          }
          prevLocation={
            editingLocationTarget === 'destination' ? lastStopLatLng : null
          }
          onClose={() => setEditingLocationTarget(null)}
          onSuccess={() => setEditingLocationTarget(null)}
        />
      )}

      {addModalType !== null && (
        <PlanSpotAddModal
          bikeId={bikeId}
          planId={planId}
          initialType={addModalType}
          initialLocation={mapClickLocation}
          prevLocation={lastStopLatLng}
          onClose={() => {
            setAddModalType(null)
            setMapClickLocation(null)
          }}
          onSuccess={() => {
            setAddModalType(null)
            setMapClickLocation(null)
          }}
        />
      )}

      {editingSpot && (
        <PlanSpotEditModal
          bikeId={bikeId}
          planId={planId}
          spot={editingSpot}
          prevLocation={editSpotPrevLocation}
          onClose={() => setEditingSpotId(null)}
          onSuccess={() => setEditingSpotId(null)}
          onDelete={() => setEditingSpotId(null)}
        />
      )}

      {isStartConfirmOpen && (
        <ModalBase
          title="このプランで開始する"
          onClose={() => setIsStartConfirmOpen(false)}
          size="sm"
        >
          <div className="space-y-4">
            <p className={styles.startNote}>
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
                onClick={handleStart}
                disabled={isStarting}
                loading={isStarting}
              >
                開始する
              </Button>
            </div>
          </div>
        </ModalBase>
      )}
    </div>
  )
}

export default withAuth(TouringPlanDetailPage)
