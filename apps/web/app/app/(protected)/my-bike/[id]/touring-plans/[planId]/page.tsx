'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import styles from './page.module.css'
import { ModalBase } from '@/components/common/ModalBase'
import { EditIcon } from '@/components/icons/EditIcon'
import { HistorySummaryCard } from '@/components/touring/HistorySummaryCard'
import { PlanEditModal } from '@/components/touring/PlanEditModal'
import { PlanLocationEditModal } from '@/components/touring/PlanLocationEditModal'
import { PlanSpotAddModal } from '@/components/touring/PlanSpotAddModal'
import { PlanSpotEditModal } from '@/components/touring/PlanSpotEditModal'
import {
  RouteTimeline,
  type RouteTimelineItem,
} from '@/components/touring/RouteTimeline'
import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'
import { useGeolocation } from '@/lib/hooks/useGeolocation'

function TouringPlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bikeId = params.id as string
  const planId = params.planId as string
  const { getCurrentPosition } = useGeolocation()

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

  const detailUrl = `/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}`
  const spotsUrl = `/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}/spots`

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

  const { data: spots, isLoading: spotsLoading } = useSWR(
    bikeId && planId ? spotsUrl : null,
    async (url) => {
      const response = await apiGet(
        url as `/api/v1/user-bike/bike/${string}/touring-plans/${string}/spots`
      )
      return response.data
    }
  )

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

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('ja-JP', {
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

  if (planLoading) {
    return (
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center min-h-100">
          <p className="text-lg">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (planError || !plan) {
    return (
      <>
        <div className="mb-4">
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}/touring-plans`)}
            variant="cloud"
          >
            ← 戻る
          </Button>
        </div>
        <div className={styles.card}>
          <h1 className="text-2xl font-bold mb-4 text-red-600">エラー</h1>
          <p className={`mb-4 ${styles.bodyText}`}>
            {planError instanceof ApiV1Error
              ? planError.message
              : 'ツーリングプランの取得に失敗しました'}
          </p>
        </div>
      </>
    )
  }

  // RouteTimelineItem に変換
  const timelineItems: RouteTimelineItem[] = []

  timelineItems.push({
    id: 'START',
    type: 'START',
    name: plan.startLocation?.name ?? '出発地',
    memo: plan.startLocation?.memo ?? null,
    latitude: plan.startLocation?.latitude ?? null,
    longitude: plan.startLocation?.longitude ?? null,
    primaryTime: {
      label: '出発予定',
      value: plan.startLocation?.plannedDepartureAt ?? null,
    },
    onEdit: () => setEditingLocationTarget('start'),
  })

  if (spots) {
    spots
      .filter((spot) => spot.type === 'SPOT' || spot.type === 'BREAK')
      .forEach((spot) => {
        timelineItems.push({
          id: spot.touringPlanSpotId,
          type: spot.type,
          name: spot.name,
          memo: spot.memo,
          latitude: spot.latitude,
          longitude: spot.longitude,
          primaryTime: { label: '到着予定', value: spot.plannedArrivalAt },
          secondaryTime: {
            label: '出発予定',
            value: spot.plannedDepartureAt,
          },
          onEdit: () => setEditingSpotId(spot.touringPlanSpotId),
        })
      })
  }

  timelineItems.push({
    id: 'DESTINATION',
    type: 'DESTINATION',
    name: plan.destinationLocation?.name ?? '目的地',
    memo: plan.destinationLocation?.memo ?? null,
    latitude: plan.destinationLocation?.latitude ?? null,
    longitude: plan.destinationLocation?.longitude ?? null,
    primaryTime: {
      label: '到着予定',
      value: plan.destinationLocation?.plannedArrivalAt ?? null,
    },
    onEdit: () => setEditingLocationTarget('destination'),
  })

  const sortableIds = (spots ?? [])
    .filter((spot) => spot.type === 'SPOT' || spot.type === 'BREAK')
    .map((spot) => spot.touringPlanSpotId)

  const editingSpot = spots?.find(
    (spot) => spot.touringPlanSpotId === editingSpotId
  )

  const handleReorder = async (newOrderIds: string[]) => {
    try {
      await apiPatch(
        `${spotsUrl}/reorder` as `/api/v1/user-bike/bike/${string}/touring-plans/${string}/spots/reorder`,
        { spotIds: newOrderIds }
      )
      await mutate(spotsUrl)
    } catch (err) {
      toast.error(
        err instanceof ApiV1Error ? err.message : '並び替えに失敗しました'
      )
    }
  }

  const handleEditSuccess = async (action: 'update' | 'delete') => {
    if (action === 'delete') {
      router.push(`/app/my-bike/${bikeId}/touring-plans`)
    } else {
      setIsEditModalOpen(false)
    }
  }

  const handleLocationEditSuccess = () => {
    setEditingLocationTarget(null)
  }

  const handleSpotAddSuccess = () => {
    setAddModalType(null)
  }

  const handleSpotEditSuccess = () => {
    setEditingSpotId(null)
  }

  const handleSpotDeleteSuccess = () => {
    setEditingSpotId(null)
  }

  const handleStart = async () => {
    setIsStarting(true)
    try {
      const { position } = await getCurrentPosition()
      await apiPost(`/api/v1/user-bike/bike/${bikeId}/tourings/start-end`, {
        action: 'start',
        touringPlanId: planId,
        startDate: new Date().toISOString(),
        startLatitude: position?.latitude,
        startLongitude: position?.longitude,
      })
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
      setIsStartConfirmOpen(false)
    }
  }

  return (
    <>
      <div className="w-full max-w-md flex flex-row items-start gap-3 mb-4">
        <div className="shrink-0 pt-0.5">
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}/touring-plans`)}
            variant="cloud"
          >
            ← 戻る
          </Button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate">{plan.title}</h1>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className={styles.editButton}
              aria-label="編集"
            >
              <EditIcon />
            </button>
          </div>
          <p className={`text-xs mt-1 ${styles.mutedText}`}>
            出発予定 {formatDateTime(plan.departAt)}
            <br />
            帰着予定 {formatDateTime(plan.returnAt)}
          </p>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className={styles.card}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">ルート</h2>
            <button
              onClick={() => setAddModalType('SPOT')}
              className={styles.editButton}
              aria-label="経由地・休憩を追加"
              title="経由地・休憩を追加"
            >
              ＋
            </button>
          </div>

          {spotsLoading ? (
            <p className={`text-sm ${styles.mutedText}`}>読み込み中...</p>
          ) : (
            <RouteTimeline
              items={timelineItems}
              sortableIds={sortableIds}
              onReorder={handleReorder}
              onStartClick={() => setEditingLocationTarget('start')}
              onDestinationClick={() => setEditingLocationTarget('destination')}
            />
          )}
        </div>

        <div className={styles.card}>
          <h2 className="text-lg font-semibold mb-4">ツーリング実績</h2>
          {touringIds.length === 0 ? (
            <p className={styles.historyEmpty}>
              このプランからのツーリング実績はまだありません
            </p>
          ) : touringsLoading ? (
            <p className={`text-sm ${styles.mutedText}`}>読み込み中...</p>
          ) : (
            <div>
              {tourings?.map((touring) => (
                <HistorySummaryCard
                  key={touring.touringId}
                  touring={touring}
                  onClick={(touringId) =>
                    router.push(`/app/my-bike/${bikeId}/tourings/${touringId}`)
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.fixedFooterSpacer} />
      </div>

      <div className={styles.fixedFooter}>
        <div className={styles.fixedFooterInner}>
          <Button
            onClick={() => setIsStartConfirmOpen(true)}
            variant="primary"
            fullWidth
            disabled={isStarting}
          >
            {isStarting ? '開始中...' : 'このプランで開始する'}
          </Button>
        </div>
      </div>

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
          onClose={() => setEditingLocationTarget(null)}
          onSuccess={handleLocationEditSuccess}
        />
      )}

      {addModalType !== null && (
        <PlanSpotAddModal
          bikeId={bikeId}
          planId={planId}
          initialType={addModalType}
          onClose={() => setAddModalType(null)}
          onSuccess={handleSpotAddSuccess}
        />
      )}

      {editingSpot && (
        <PlanSpotEditModal
          bikeId={bikeId}
          planId={planId}
          spot={editingSpot}
          onClose={() => setEditingSpotId(null)}
          onSuccess={handleSpotEditSuccess}
          onDelete={handleSpotDeleteSuccess}
        />
      )}

      {isStartConfirmOpen && (
        <ModalBase
          title="このプランで開始する"
          onClose={() => setIsStartConfirmOpen(false)}
          size="sm"
        >
          <div className="space-y-4">
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
    </>
  )
}

export default withAuth(TouringPlanDetailPage)
