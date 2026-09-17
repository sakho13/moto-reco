'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import { getCurrentDate } from '@repo/shared-utils'
import { toast } from '@repo/ui/sonner'
import styles from './page.module.css'
import { HomeActions } from '@/components/home/HomeActions'
import { HomeGauges } from '@/components/home/HomeGauges'
import { HomeOdometer } from '@/components/home/HomeOdometer'
import { TodaySheetHead } from '@/components/home/TodaySheetHead'
import { UpcomingMaintenanceRail } from '@/components/home/UpcomingMaintenanceRail'
import { WriteMoreActions } from '@/components/home/WriteMoreActions'
import { RecentHistorySection } from '@/components/RecentHistorySection'
import { TouringModeView } from '@/components/touring/TouringModeView'
import { trackEvent } from '@/lib/analytics'
import { apiGet, apiPost } from '@/lib/api/client'
import { mutateHistoryLists } from '@/lib/api/mutateHistory'
import { getBikeDisplayName } from '@/lib/bike'
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

  // バイク名を組み立てる（進行中ツーリングを持つバイクの名称。アクティブ車両とは独立）
  const activeBikeInfo = activeBikeEntry
    ? bikes.find((b) => b.myUserBikeId === activeBikeEntry.myUserBikeId)
    : null
  const activeBikeName = activeBikeInfo
    ? getBikeDisplayName(activeBikeInfo)
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
      trackEvent('touring_end', {
        has_position: position != null,
        has_end_mileage: endMileage !== undefined,
      })

      toast.success('ツーリングを終了しました')
      await mutate('/api/v1/user-bike/bikes/ongoing-tourings').catch(() => {})
      await mutateHistoryLists()
    } catch (error) {
      trackEvent('touring_error', {
        operation: 'end',
        ...(error instanceof ApiV1Error
          ? { error_code: error.errorCode, error_message: error.message }
          : {}),
      })
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
    <div className={styles.home}>
      {/* 見出し罫（今日の日付・当月サマリ）。PC専用（モバイルは非表示） */}
      <div className={styles.head}>
        <TodaySheetHead />
      </div>

      {/* オドメーター（総走行距離のプレート表示）。PC専用（モバイルは非表示） */}
      <div className={styles.odo}>
        <HomeOdometer />
      </div>

      {/* 計器（直近燃費・平均燃費・前回単価。PC幅では今月の燃料費も加わる） */}
      <div className={styles.figs}>
        <HomeGauges />
      </div>

      {/*
        「書き足す」レール（主アクション・整備の記入・点検の予定）。
        PC幅ではこの3つをひとつの grid-area にまとめて内側をflexで積むことで、
        台帳（ledger）の高さに引き伸ばされて項目間に空白ができるのを防ぐ
        （`page.module.css` の `.rail` 参照）。モバイルはこのラッパー自体に
        スタイルが無いため、これまでどおり railActions のみ表示される。
      */}
      <div className={styles.rail}>
        {/* 主アクション（給油を記録・ツーリングを開始） */}
        <div className={styles.railActions}>
          <p className={styles.railLabel}>書き足す</p>
          <HomeActions />
        </div>

        {/* 書き足す（整備）。PC専用（モバイルは非表示） */}
        <div className={styles.railWrite}>
          <WriteMoreActions />
        </div>

        {/* 点検の予定。PC専用（モバイルは非表示） */}
        <div className={styles.railMaint}>
          <UpcomingMaintenanceRail />
        </div>
      </div>

      {/* 最近の記録（記帳）。PC幅では左カラムの台帳になる */}
      <div className={styles.ledger}>
        <RecentHistorySection />
      </div>
    </div>
  )
}

export default withAuth(Page)
