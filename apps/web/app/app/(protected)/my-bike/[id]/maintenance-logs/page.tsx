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
import { MaintenanceLedgerSection } from '@/components/bike/MaintenanceLedgerSection'
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
              : 'メンテナンス履歴の取得に失敗しました'}
          </p>
          <Button onClick={() => router.push(`/app/my-bike/${bikeId}`)}>
            愛車に戻る
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

      <div className={`${styles.topBar} flex flex-row flex-wrap gap-2`}>
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
      <div className={`${styles.topBar} ${styles.viewToggle} mt-3`}>
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

      <div className={`${styles.listLayout} mt-3`}>
        {viewMode === 'date' ? (
          <>
            <div className={styles.mobileOnly}>
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
            </div>
            <div className={styles.desktopOnly}>
              <MaintenanceLedgerSection bikeId={bikeId} onSelect={handleEdit} />
            </div>
          </>
        ) : isAllLoading ? (
          <div className="flex items-center justify-center p-8">
            <p>読み込み中...</p>
          </div>
        ) : (
          <>
            <div className={styles.mobileOnly}>
              <MaintenanceLogByItemSection
                logs={allLogs ?? []}
                currentMileage={bikeData?.totalMileage}
                onRegister={() => setIsRegisterModalOpen(true)}
              />
            </div>
            <div className={styles.desktopOnly}>
              <MaintenanceLogByItemSection
                logs={allLogs ?? []}
                currentMileage={bikeData?.totalMileage}
                onRegister={() => setIsRegisterModalOpen(true)}
                noBorder
              />
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default withAuth(MaintenanceLogsPage)
