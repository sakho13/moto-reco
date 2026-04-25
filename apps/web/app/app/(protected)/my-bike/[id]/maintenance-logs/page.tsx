'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWRInfinite from 'swr/infinite'
import type {
  ApiResponseMaintenanceLogDetail,
  ApiResponseMaintenanceLogList,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { MaintenanceLogEditModal } from '@/components/maintenance-log/MaintenanceLogEditModal'
import { MaintenanceLogListSection } from '@/components/maintenance-log/MaintenanceLogListSection'
import { MaintenanceLogRegisterModal } from '@/components/maintenance-log/MaintenanceLogRegisterModal'
import { authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

const PER_SIZE = 20

function MaintenanceLogsPage() {
  const params = useParams()
  const router = useRouter()
  const bikeId = params.id as string
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [editingLog, setEditingLog] =
    useState<ApiResponseMaintenanceLogDetail | null>(null)

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

  const { data, error, isLoading, size, setSize, isValidating } =
    useSWRInfinite(
      (pageIndex: number) =>
        bikeId
          ? `/api/v1/user-bike/bike/${bikeId}/maintenance-logs?sort-order=desc&per-size=${PER_SIZE}&page=${pageIndex + 1}`
          : null,
      fetchLogs
    )

  if (isLoading) {
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

  return (
    <>
      {isRegisterModalOpen && (
        <MaintenanceLogRegisterModal
          bikeId={bikeId}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setIsRegisterModalOpen(false)
            setSize(1)
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
            setSize(1)
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

      <div className="w-full max-w-md">
        <MaintenanceLogListSection
          logs={logs}
          onEdit={handleEdit}
          onRegister={() => setIsRegisterModalOpen(true)}
          onLoadMore={() => setSize(size + 1)}
          canLoadMore={canLoadMore}
          isLoadingMore={isLoadingMore}
        />
      </div>
    </>
  )
}

export default withAuth(MaintenanceLogsPage)
