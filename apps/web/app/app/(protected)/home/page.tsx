'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { getCurrentDate } from '@repo/shared-utils'
import { toast } from '@repo/ui/sonner'
import { QuickFuelSection } from '@/components/QuickFuelSection'
import { RecentHistorySection } from '@/components/RecentHistorySection'
import { TouringModeView } from '@/components/touring/TouringModeView'
import { TouringStartEndSection } from '@/components/TouringStartEndSection'
import { apiGet, apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'
import { useGeolocation } from '@/lib/hooks/useGeolocation'

function Page() {
  const [loadingBikeId, setLoadingBikeId] = useState<string | null>(null)
  const { getCurrentPosition } = useGeolocation()

  const { data: bikesData } = useSWR('/api/v1/user-bike/bikes', async (url) => {
    const response = await apiGet(url)
    return response.data
  })

  const { data: ongoingTouringsData } = useSWR(
    '/api/v1/user-bike/bikes/ongoing-tourings',
    async (url) => {
      const response = await apiGet(url)
      return response.data
    }
  )

  const bikes = bikesData?.bikes ?? []
  const ongoingTourings = ongoingTouringsData?.bikes ?? []

  // 進行中のツーリングを持つバイクを探す
  const activeBikeEntry = ongoingTourings.find((b) => b.ongoingTouring !== null)
  const activeTouring = activeBikeEntry?.ongoingTouring ?? null

  // バイク名を組み立てる（TouringStartEndSection と同じロジック）
  const activeBikeInfo = activeBikeEntry
    ? bikes.find((b) => b.myUserBikeId === activeBikeEntry.myUserBikeId)
    : null
  const activeBikeName = activeBikeInfo
    ? activeBikeInfo.nickname ||
      `${activeBikeInfo.manufacturerName || ''} ${activeBikeInfo.modelName || '不明なバイク'}`.trim()
    : ''

  const handleEndTouring = async (
    myUserBikeId: string,
    touringId: string,
    endMileage?: number
  ) => {
    setLoadingBikeId(myUserBikeId)
    try {
      const { position } = await getCurrentPosition()

      await apiPost(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end` as const,
        {
          action: 'end',
          touringId,
          endDate: getCurrentDate().toISOString(),
          endLatitude: position?.latitude,
          endLongitude: position?.longitude,
          endMileage,
        }
      )

      toast.success('ツーリングを終了しました')
      await mutate('/api/v1/user-bike/bikes/ongoing-tourings')
    } catch (error) {
      if (error instanceof ApiV1Error) {
        toast.error(error.message)
      } else {
        toast.error('ツーリングの終了に失敗しました')
      }
    } finally {
      setLoadingBikeId(null)
    }
  }

  // ツーリング中は全画面の TouringModeView を表示
  if (activeBikeEntry && activeTouring) {
    return (
      <div className="w-full">
        <TouringModeView
          myUserBikeId={activeBikeEntry.myUserBikeId}
          bikeName={activeBikeName}
          touringId={activeTouring.touringId}
          title={activeTouring.title}
          startDate={activeTouring.startDate}
          startMileage={activeTouring.startMileage}
          endLatitude={activeTouring.endLatitude}
          endLongitude={activeTouring.endLongitude}
          isLoading={loadingBikeId === activeBikeEntry.myUserBikeId}
          onEnd={(endMileage) =>
            handleEndTouring(
              activeBikeEntry.myUserBikeId,
              activeTouring.touringId,
              endMileage
            )
          }
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg">
      {/* ツーリング開始停止（上） */}
      <TouringStartEndSection />

      {/* 給油クイック登録 */}
      <QuickFuelSection />

      {/* 最新ヒストリー */}
      <RecentHistorySection />
    </div>
  )
}

export default withAuth(Page)
