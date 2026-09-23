'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseFuelLogList,
  ApiResponseUserBikeDetail,
  FuelLogPeriod,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './page.module.css'
import { BikeCarteControls } from '@/components/bike/BikeCarteControls'
import { BikeFuelGraphSection } from '@/components/bike/BikeFuelGraphSection'
import { BikeFuelLedgerExcerpt } from '@/components/bike/BikeFuelLedgerExcerpt'
import { BikeGauges } from '@/components/bike/BikeGauges'
import { BikeHeroSection } from '@/components/bike/BikeHeroSection'
import { BikePrimaryAction } from '@/components/bike/BikePrimaryAction'
import { BikeRecordLinks } from '@/components/bike/BikeRecordLinks'
import { BikeStatsSection } from '@/components/bike/BikeStatsSection'
import { MaintenanceScheduleSection } from '@/components/bike/MaintenanceScheduleSection'
import { BikePhotosCard } from '@/components/photo/BikePhotosCard'
import { apiGet, authenticatedFetch } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'
import { useActiveBike } from '@/lib/hooks/useActiveBike'
import { useAuth } from '@/lib/hooks/useAuth'
import { BIKE_CARTE_PERIOD_FETCH_SIZE } from '@/lib/statics'

async function fetchFuelLogList(url: string): Promise<ApiResponseFuelLogList> {
  const response = await authenticatedFetch(url, { method: 'GET' })
  if (!response.ok) {
    const errorData = await response.json()
    throw new ApiV1Error(
      errorData.errorCode || 'SERVER_ERROR',
      errorData.message || '給油履歴の取得に失敗しました'
    )
  }
  const json =
    (await response.json()) as SuccessResponse<ApiResponseFuelLogList>
  return json.data
}

/**
 * 愛車の詳細（カルテ）
 *
 * @remarks
 * 一覧を挟まずアクティブ車両の詳細を直接開く構成（Issue #575）の詳細ページ本体。
 * 見出し・車両情報 → 計器 → 点検の予定 → 主アクション → 記録へのリンクの順に構成する
 * （画面案の並び順は、モバイルモック「愛車」の視覚的な流れ：ヒーロー→CTA→行リスト
 * を優先し、CTAを記録へのリンクより先に置いている）。
 */
function BikeDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { isGuest } = useAuth()
  const { setActiveBikeId } = useActiveBike()

  const [period, setPeriod] = useState<FuelLogPeriod>('latest-year')
  const [fullTankOnly, setFullTankOnly] = useState(false)

  const { data: profile } = useSWR('/api/v1/user/profile', async (url) => {
    const response = await apiGet(url)
    return response.data
  })
  const isAdmin = profile?.role === 'ADMIN'

  const { data, error, isLoading } = useSWR(
    id ? `/api/v1/user-bike/bike/${id}` : null,
    async (url) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new ApiV1Error(
          errorData.errorCode || 'SERVER_ERROR',
          errorData.message || 'エラーが発生しました'
        )
      }
      const json =
        (await response.json()) as SuccessResponse<ApiResponseUserBikeDetail>
      return json.data
    }
  )

  // 添え数値・方眼グラフ・給油の台帳（抜粋）はPC（1024px〜）でのみ使う
  // 期間指定データを共有する（Issue #575「05 画面案 ─ PC」愛車）。
  // 新しいAPIは追加せず、既存の給油履歴一覧APIを昇順・期間指定で取得する。
  const { data: periodFuelLogsRaw, isLoading: isPeriodFuelLogsLoading } =
    useSWR(
      id
        ? `/api/v1/user-bike/bike/${id}/fuel-logs?sort-by=refueled-at&sort-order=asc&per-size=${BIKE_CARTE_PERIOD_FETCH_SIZE}&period=${period}`
        : null,
      fetchFuelLogList
    )

  // 平均燃費（`BikeStatsSection`）の満タン法区間判定にのみ使う、期間フィルタ
  // 前の給油履歴全件（Issue #575 Codexの指摘#5。`PrismaFuelInsightRepository`
  // の `findBridgeRows` と同じ考え方）。新しいAPIは追加せず、既存の給油履歴
  // 一覧APIを期間指定なし（全期間）で取得する。
  const { data: allFuelLogsRaw, isLoading: isAllFuelLogsLoading } = useSWR(
    id
      ? `/api/v1/user-bike/bike/${id}/fuel-logs?sort-by=mileage&sort-order=asc&per-size=${BIKE_CARTE_PERIOD_FETCH_SIZE}`
      : null,
    fetchFuelLogList
  )

  const periodFuelLogs = useMemo(() => {
    const logs = periodFuelLogsRaw ?? []
    return fullTankOnly ? logs.filter((log) => log.isFullTank) : logs
  }, [periodFuelLogsRaw, fullTankOnly])

  // 区間判定（満タン法）には常に「満タンのみ」フィルタ適用前の全件を使う。
  // 継ぎ足し給油は元々どの区間でも算出対象にならない（`calculateDetails` が
  // 継ぎ足し単体には常に null を返す）ため、ここでフィルタして除いてしまうと、
  // 区間をまたぐ継ぎ足しの給油量が次の満タン給油の区間から失われ、
  // かえって平均燃費が不正確になる。
  const allFuelLogs = allFuelLogsRaw ?? []

  // このバイクの詳細を開いたら、アクティブ車両をこのバイクに同期する
  // （ヘッダーのBikeSwitcher・ホームなどアプリ全体が参照する）
  useEffect(() => {
    if (data) {
      setActiveBikeId(id)
    }
  }, [data, id, setActiveBikeId])

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p className={styles.centerMessage}>読み込み中...</p>
      </div>
    )
  }

  if (error) {
    const isNotFound =
      error instanceof ApiV1Error && error.errorCode === 'NOT_FOUND'

    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <h1 className={styles.errorTitle}>
            {isNotFound ? 'バイクが見つかりません' : 'エラー'}
          </h1>
          <p className={styles.errorMessage}>
            {isNotFound
              ? '指定されたバイクは存在しないか、削除されています。'
              : error instanceof ApiV1Error
                ? error.message
                : 'バイク情報の取得に失敗しました'}
          </p>
          <Button onClick={() => (window.location.href = '/app/home')}>
            ホームに戻る
          </Button>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const bike = data

  return (
    <div className={styles.page}>
      <BikeHeroSection bike={bike} />

      <div className={styles.mobileOnly}>
        <BikeGauges bikeId={id} totalMileage={bike.totalMileage} />
      </div>

      {/*
       * PC（1024px〜）: 添え数値・方眼グラフ（Issue #575「05 画面案 ─ PC」愛車）。
       * `BikeGauges`（モバイルの計器）とは排他表示のため、
       * 「平均燃費」ラベルが同時にDOM上へ2つ出ることはない。
       */}
      <div className={styles.desktopOnly}>
        <BikeCarteControls
          period={period}
          onPeriodChange={setPeriod}
          fullTankOnly={fullTankOnly}
          onFullTankOnlyChange={setFullTankOnly}
        />
        <BikeStatsSection
          fuelLogs={periodFuelLogs}
          allFuelLogs={allFuelLogs}
          isLoading={isPeriodFuelLogsLoading || isAllFuelLogsLoading}
        />
        <BikeFuelGraphSection fuelLogs={periodFuelLogs} />
      </div>

      <MaintenanceScheduleSection bikeId={id} />

      <BikePrimaryAction
        bikeId={id}
        fuelLogCount={bike.fuelLogCount}
        isGuest={isGuest}
      />

      {/* PC（1024px〜）: 給油の台帳の抜粋。全件は /fuel-logs へ */}
      <div className={styles.desktopOnly}>
        <BikeFuelLedgerExcerpt
          bikeId={id}
          period={period}
          fuelLogs={periodFuelLogs}
        />
      </div>

      <BikeRecordLinks
        bikeId={id}
        fuelLogCount={bike.fuelLogCount}
        touringCount={bike.touringCount}
        isAdmin={isAdmin}
      />

      {isAdmin && <BikePhotosCard myUserBikeId={id} />}
    </div>
  )
}

export default withAuth(BikeDetailPage)
