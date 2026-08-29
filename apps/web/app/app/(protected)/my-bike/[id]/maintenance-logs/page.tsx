'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseMaintenanceLogDetail,
  ApiResponseMaintenanceLogList,
  ApiResponseUserBikeDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './page.module.css'
import { MaintenanceLogByItemSection } from '@/components/maintenance-log/MaintenanceLogByItemSection'
import { MaintenanceLogEditModal } from '@/components/maintenance-log/MaintenanceLogEditModal'
import { MaintenanceLogListSection } from '@/components/maintenance-log/MaintenanceLogListSection'
import { MaintenanceLogRegisterModal } from '@/components/maintenance-log/MaintenanceLogRegisterModal'
import { authenticatedFetch } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'

const PER_SIZE = 20

type ViewMode = 'date' | 'item'

function MaintenanceLogsPage() {
  const params = useParams()
  const router = useRouter()
  const bikeId = params.id as string
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [editingLog, setEditingLog] =
    useState<ApiResponseMaintenanceLogDetail | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('date')
  const [keyword, setKeyword] = useState('')

  const fetchLogs = async (url: string) => {
    const response = await authenticatedFetch(url, { method: 'GET' })
    if (!response.ok) {
      const errorData = await response.json()
      throw new ApiV1Error(
        errorData.errorCode || 'SERVER_ERROR',
        errorData.message || 'エラーが発生しました'
      )
    }
    const json =
      (await response.json()) as SuccessResponse<ApiResponseMaintenanceLogList>
    return json.data
  }

  // 日付順ビュー用: 無限スクロール
  const { data, error, isLoading, size, setSize, isValidating } =
    useSWRInfinite(
      (pageIndex: number) =>
        bikeId
          ? `/api/v1/user-bike/bike/${bikeId}/maintenance-logs?sort-order=desc&per-size=${PER_SIZE}&page=${pageIndex + 1}${
              keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''
            }`
          : null,
      fetchLogs,
      { keepPreviousData: true }
    )

  // 項目別ビュー用: 全件取得（最大100件）
  const { data: allLogs, isLoading: isAllLoading } = useSWR(
    viewMode === 'item' && bikeId
      ? `/api/v1/user-bike/bike/${bikeId}/maintenance-logs?sort-order=desc&per-size=100&page=1`
      : null,
    fetchLogs
  )

  // 現在の総走行距離取得
  const { data: bikeData } = useSWR(
    bikeId ? `/api/v1/user-bike/bike/${bikeId}` : null,
    async (url) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) return null
      const json =
        (await response.json()) as SuccessResponse<ApiResponseUserBikeDetail>
      return json.data
    }
  )

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
              : 'メンテナンス履歴の取得に失敗しました'}
          </p>
          <Button onClick={() => router.push(`/app/my-bike/${bikeId}`)}>
            バイク詳細に戻る
          </Button>
        </div>
      </div>
    )
  }

  const logs = data ? data.filter(Boolean).flat() : []
  const lastPageCount = data?.[data.length - 1]?.length ?? 0
  const canLoadMore = lastPageCount === PER_SIZE
  const isLoadingMore = isValidating && !isLoading && size > 0

  const handleEdit = (maintenanceLogId: string) => {
    const log = logs.find((l) => l.maintenanceLogId === maintenanceLogId)
    if (log) setEditingLog(log)
  }

  const handleSuccess = () => {
    setSize(1)
  }

  const handleSearch = (value: string) => {
    setKeyword(value)
    setSize(1)
  }

  return (
    <>
      {isRegisterModalOpen && (
        <MaintenanceLogRegisterModal
          bikeId={bikeId}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setIsRegisterModalOpen(false)
            handleSuccess()
          }}
        />
      )}

      {editingLog && (
        <MaintenanceLogEditModal
          bikeId={bikeId}
          log={editingLog}
          onClose={() => setEditingLog(null)}
          onSuccess={() => {
            setEditingLog(null)
            handleSuccess()
          }}
        />
      )}

      <div className="w-full max-w-md flex flex-row gap-2">
        <Button
          onClick={() => router.push(`/app/my-bike/${bikeId}`)}
          variant="cloud"
        >
          ← 戻る
        </Button>

        <Button onClick={() => setIsRegisterModalOpen(true)} variant="primary">
          メンテナンスを登録
        </Button>
      </div>

      {/* ビュー切替タブ */}
      <div className={`w-full max-w-md ${styles.viewToggle}`}>
        <button
          className={`${styles.toggleButton} ${viewMode === 'date' ? styles.active : ''}`}
          onClick={() => setViewMode('date')}
        >
          日付順
        </button>
        <button
          className={`${styles.toggleButton} ${viewMode === 'item' ? styles.active : ''}`}
          onClick={() => setViewMode('item')}
        >
          項目別
        </button>
      </div>

      <div className="w-full max-w-md">
        {viewMode === 'date' ? (
          <MaintenanceLogListSection
            logs={logs}
            onEdit={handleEdit}
            onRegister={() => setIsRegisterModalOpen(true)}
            onLoadMore={() => setSize(size + 1)}
            canLoadMore={canLoadMore}
            isLoadingMore={isLoadingMore}
            onSearch={handleSearch}
            isSearchActive={keyword.length > 0}
          />
        ) : isAllLoading ? (
          <div className="flex items-center justify-center p-8">
            <p>読み込み中...</p>
          </div>
        ) : (
          <MaintenanceLogByItemSection
            logs={allLogs ?? []}
            currentMileage={bikeData?.totalMileage}
            onRegister={() => setIsRegisterModalOpen(true)}
          />
        )}
      </div>
    </>
  )
}

export default withAuth(MaintenanceLogsPage)
