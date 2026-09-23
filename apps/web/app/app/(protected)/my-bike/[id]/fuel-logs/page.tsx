'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseFuelLogList,
  FuelLogPeriod,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { FuelEfficiencyChart } from '@repo/ui/fuelEfficiencyChart'
import { Select } from '@repo/ui/select'
import styles from './page.module.css'
import { BikeCarteControls } from '@/components/bike/BikeCarteControls'
import { BikeFuelGraphSection } from '@/components/bike/BikeFuelGraphSection'
import { FuelLedgerSection } from '@/components/bike/FuelLedgerSection'
import { InfoBox } from '@/components/bike/InfoBox'
import { FuelLogEditModal } from '@/components/fuel-log/FuelLogEditModal'
import { FuelLogListSection } from '@/components/fuel-log/FuelLogListSection'
import { FuelLogRegisterModal } from '@/components/fuel-log/FuelLogRegisterModal'
import { authenticatedFetch } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'
import { useAuth } from '@/lib/hooks/useAuth'
import { FUEL_LOG_PERIOD_OPTIONS, GUEST_ACCOUNT_LIMITS } from '@/lib/statics'

function FuelLogsPage() {
  const params = useParams()
  const router = useRouter()
  const { isGuest } = useAuth()
  const bikeId = params.id as string
  const [chartPeriod, setChartPeriod] = useState<FuelLogPeriod>('latest-year')
  // PC（1024px〜）の「燃費の推移」（`BikeCarteControls` の満タンフィルタ）専用。
  // モバイルの角丸カード版グラフには満タンフィルタが無いため影響しない。
  const [chartFullTankOnly, setChartFullTankOnly] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [editingFuelLogId, setEditingFuelLogId] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')

  // 愛車カルテ（`BikeCarteControls`）・台帳（`FuelLedgerSection`）と共通の
  // 選択肢（`lib/statics.ts` を単一の情報源にし、表記ずれを防ぐ）
  const chartPeriodOptions = FUEL_LOG_PERIOD_OPTIONS

  const fetchFuelLogs = async (url: string) => {
    const response = await authenticatedFetch(url, { method: 'GET' })
    if (!response.ok) {
      const errorData = await response.json()
      throw new ApiV1Error(
        errorData.errorCode || 'SERVER_ERROR',
        errorData.message || 'エラーが発生しました'
      )
    }
    const json =
      (await response.json()) as SuccessResponse<ApiResponseFuelLogList>
    return json.data
  }

  const { data, error, isLoading, size, setSize, isValidating } =
    useSWRInfinite(
      (pageIndex) =>
        bikeId
          ? `/api/v1/user-bike/bike/${bikeId}/fuel-logs?sort-by=refueled-at&sort-order=desc&per-size=10&page=${
              pageIndex + 1
            }${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}`
          : null,
      fetchFuelLogs,
      { keepPreviousData: true }
    )

  const {
    data: chartData,
    error: chartError,
    isLoading: isChartLoading,
  } = useSWR(
    bikeId
      ? `/api/v1/user-bike/bike/${bikeId}/fuel-logs?sort-by=refueled-at&sort-order=asc&per-size=100&period=${chartPeriod}`
      : null,
    fetchFuelLogs
  )

  const handleEdit = (fuelLogId: string) => {
    setEditingFuelLogId(fuelLogId)
  }

  const handleRegister = () => {
    setIsRegisterModalOpen(true)
  }

  const handleLoadMore = () => {
    setSize(size + 1)
  }

  const handleSearch = (value: string) => {
    setKeyword(value)
    setSize(1)
  }

  if (isLoading && !data) {
    return (
      <div className={styles.fallback}>
        <div className={styles.loadingBox}>
          <p className={styles.loadingText}>読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.fallback}>
        <div className={styles.errorActions}>
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}`)}
            variant="cloud"
          >
            ← 戻る
          </Button>
        </div>

        <div className={styles.errorBox}>
          <h1 className={styles.errorTitle}>エラー</h1>
          <p className={styles.errorMessage}>
            {error instanceof ApiV1Error
              ? error.message
              : '給油履歴の取得に失敗しました'}
          </p>
          <Button onClick={() => router.push(`/app/my-bike/${bikeId}`)}>
            愛車に戻る
          </Button>
        </div>
      </div>
    )
  }

  const fuelLogs = data ? data.filter(Boolean).flat() : []
  const lastPageCount = data?.[data.length - 1]?.length ?? 0
  const canLoadMore = lastPageCount === 10
  const isLoadingMore = isValidating && !isLoading && size > 0
  const isAtGuestFuelLimit =
    isGuest && !isLoading && fuelLogs.length >= GUEST_ACCOUNT_LIMITS.FUEL_LOG

  const chartFuelLogs = chartData || []

  // 有効な燃費データが2件以上あるかチェック（モバイルの角丸カード版グラフ用）
  const validChartFuelLogs = chartFuelLogs.filter(
    (log) => log.fuelEfficiency !== null
  )

  // PC（1024px〜）の「燃費の推移」（`BikeFuelGraphSection`）用。満タンフィルタは
  // 愛車カルテと同じ `BikeCarteControls` から適用する（モバイル版グラフには無い）。
  const desktopChartFuelLogs = chartFullTankOnly
    ? chartFuelLogs.filter((log) => log.isFullTank)
    : chartFuelLogs

  return (
    <>
      {isRegisterModalOpen && (
        <FuelLogRegisterModal
          bikeId={bikeId}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setIsRegisterModalOpen(false)
            setSize(1)
          }}
        />
      )}

      {editingFuelLogId && (
        <FuelLogEditModal
          bikeId={bikeId}
          fuelLogId={editingFuelLogId}
          onClose={() => setEditingFuelLogId(null)}
          onSuccess={() => {
            setEditingFuelLogId(null)
            setSize(1)
          }}
        />
      )}

      <div className={`${styles.topBar} flex flex-col gap-2`}>
        <div className="flex flex-row gap-2">
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}`)}
            variant="cloud"
          >
            ← 戻る
          </Button>

          <Button
            onClick={handleRegister}
            variant="primary"
            disabled={isAtGuestFuelLimit}
          >
            給油を記録
          </Button>
        </div>
        {isGuest && !isLoading && (
          <InfoBox variant={isAtGuestFuelLimit ? 'warning' : 'info'}>
            ゲストアカウントは給油履歴を{GUEST_ACCOUNT_LIMITS.FUEL_LOG}
            件まで登録できます（
            {fuelLogs.length}/{GUEST_ACCOUNT_LIMITS.FUEL_LOG}件）
          </InfoBox>
        )}
      </div>

      <div className={styles.pageLayout}>
        {/* 左カラム（モバイルでは上）: グラフ */}
        <div className={styles.chartSection}>
          {/*
            モバイル/タブレット（〜1023px）: 既存の角丸カード＋内蔵見出し
            「燃費推移グラフ」のまま変更しない。
          */}
          <div className={styles.mobileOnly}>
            <div className={styles.chartControls}>
              <Select
                id="chart-period"
                options={chartPeriodOptions}
                value={chartPeriod}
                onChange={(event) =>
                  setChartPeriod(event.target.value as FuelLogPeriod)
                }
              />
            </div>
            {isChartLoading ? (
              <div className={styles.chartPlaceholder}>
                <p>燃費グラフを読み込み中...</p>
              </div>
            ) : chartError ? (
              <div className={styles.chartPlaceholder}>
                <p>燃費グラフの取得に失敗しました</p>
              </div>
            ) : validChartFuelLogs.length >= 2 ? (
              <FuelEfficiencyChart fuelLogs={chartFuelLogs} />
            ) : (
              <div className={styles.chartPlaceholder}>
                <p>グラフ表示には2回以上の給油履歴が必要です</p>
              </div>
            )}
          </div>

          {/*
            PC（1024px〜）: 愛車カルテの「燃費の推移」（方眼紙・`BikeCarteControls`）
            と同じ見た目・見出しに揃える。同じ内容が2つの見た目・2つの名称で
            存在していた不一致を解消する。
          */}
          <div className={styles.desktopOnly}>
            <BikeCarteControls
              period={chartPeriod}
              onPeriodChange={setChartPeriod}
              fullTankOnly={chartFullTankOnly}
              onFullTankOnlyChange={setChartFullTankOnly}
            />
            <BikeFuelGraphSection fuelLogs={desktopChartFuelLogs} />
          </div>
        </div>

        {/* 右カラム（モバイルでは下）: リスト。PC（1024px〜）は台帳に差し替える */}
        <div className={styles.listSection}>
          <div className={styles.mobileOnly}>
            <FuelLogListSection
              fuelLogs={fuelLogs}
              onEdit={handleEdit}
              onRegister={handleRegister}
              onLoadMore={handleLoadMore}
              canLoadMore={canLoadMore}
              isLoadingMore={isLoadingMore}
              onSearch={handleSearch}
              isSearchActive={keyword.length > 0}
            />
          </div>

          <div className={styles.desktopOnly}>
            <FuelLedgerSection bikeId={bikeId} onEdit={handleEdit} />
          </div>
        </div>
      </div>
    </>
  )
}

export default withAuth(FuelLogsPage)
