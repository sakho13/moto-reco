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
import type { SelectOption } from '@repo/ui/select'
import styles from './page.module.css'
import { InfoBox } from '@/components/bike/InfoBox'
import { FuelLogEditModal } from '@/components/fuel-log/FuelLogEditModal'
import { FuelLogListSection } from '@/components/fuel-log/FuelLogListSection'
import { FuelLogRegisterModal } from '@/components/fuel-log/FuelLogRegisterModal'
import { authenticatedFetch } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'
import { useAuth } from '@/lib/hooks/useAuth'
import { GUEST_ACCOUNT_LIMITS } from '@/lib/statics'

function FuelLogsPage() {
  const params = useParams()
  const router = useRouter()
  const { isGuest } = useAuth()
  const bikeId = params.id as string
  const [chartPeriod, setChartPeriod] = useState<FuelLogPeriod>('latest-year')
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [editingFuelLogId, setEditingFuelLogId] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')

  const chartPeriodOptions: SelectOption[] = [
    { value: 'latest-year', label: '最新の履歴から1年' },
    { value: 'latest-month', label: '最新の履歴から1ヶ月' },
    { value: 'past-year', label: '現在日時から直近1年' },
    { value: 'past-month', label: '現在日時から直近1ヶ月' },
  ]

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
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center min-h-100">
          <p className="text-lg">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}`)}
            variant="cloud"
          >
            ← 戻る
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h1 className="text-2xl font-bold mb-4 text-red-600">エラー</h1>
          <p className="text-gray-700 mb-4">
            {error instanceof ApiV1Error
              ? error.message
              : '給油履歴の取得に失敗しました'}
          </p>
          <Button onClick={() => router.push(`/app/my-bike/${bikeId}`)}>
            バイク詳細に戻る
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

  // 有効な燃費データが2件以上あるかチェック
  const validChartFuelLogs = chartFuelLogs.filter(
    (log) => log.fuelEfficiency !== null
  )

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

      <div className="w-full max-w-md flex flex-col gap-2">
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
            給油履歴を登録
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

        {/* 右カラム（モバイルでは下）: リスト */}
        <div className={styles.listSection}>
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
      </div>
    </>
  )
}

export default withAuth(FuelLogsPage)
