'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import type {
  ApiResponseTouringDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { InfoBox } from '@/components/bike/InfoBox'
import { TouringDeleteConfirmModal } from '@/components/touring/TouringDeleteConfirmModal'
import { TouringListSection } from '@/components/touring/TouringListSection'
import { authenticatedFetch, apiDelete } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function TouringsPage() {
  const params = useParams()
  const router = useRouter()
  const bikeId = params.id as string

  const [pendingDeleteTouringId, setPendingDeleteTouringId] = useState<
    string | null
  >(null)

  const fetchTourings = async (url: string) => {
    const response = await authenticatedFetch(url, { method: 'GET' })
    if (!response.ok) {
      const errorData = await response.json()
      throw new ApiV1Error(
        errorData.errorCode || 'SERVER_ERROR',
        errorData.message || 'エラーが発生しました'
      )
    }
    const json = (await response.json()) as SuccessResponse<
      ApiResponseTouringDetail[]
    >
    return json.data
  }

  const {
    data: tourings,
    error,
    isLoading,
  } = useSWR(
    bikeId
      ? `/api/v1/user-bike/bike/${bikeId}/tourings?sort-by=end-date&sort-order=desc`
      : null,
    fetchTourings
  )

  const handleDelete = (touringId: string) => {
    setPendingDeleteTouringId(touringId)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDeleteTouringId) return
    const touringId = pendingDeleteTouringId
    setPendingDeleteTouringId(null)
    try {
      await apiDelete(`/api/v1/user-bike/bike/${bikeId}/tourings`, {
        touringId,
      })
      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings?sort-by=end-date&sort-order=desc`
      )
    } catch {
      // エラーは無視（toast通知は不要）
    }
  }

  const handleCancelDelete = () => {
    setPendingDeleteTouringId(null)
  }

  const handleDetail = (touringId: string) => {
    router.push(`/app/my-bike/${bikeId}/tourings/${touringId}`)
  }

  const handleRegister = () => {
    router.push(`/app/my-bike/${bikeId}/tourings/register`)
  }

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
      <>
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
              : 'ツーリング履歴の取得に失敗しました'}
          </p>
          <Button onClick={() => router.push(`/app/my-bike/${bikeId}`)}>
            バイク詳細に戻る
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="w-full max-w-md flex flex-row gap-2">
        <Button
          onClick={() => router.push(`/app/my-bike/${bikeId}`)}
          variant="cloud"
        >
          ← 戻る
        </Button>

        <Button onClick={handleRegister} variant="primary">
          ツーリング履歴を登録
        </Button>
      </div>

      <InfoBox variant="info" className="w-full max-w-md mt-3 text-sm">
        開始・終了地点の位置情報は本人のみ閲覧でき、他のユーザーには公開されません。
      </InfoBox>

      <div className="w-full max-w-md">
        <TouringListSection
          tourings={tourings || []}
          onDetail={handleDetail}
          onDelete={handleDelete}
          onRegister={handleRegister}
        />
      </div>

      {pendingDeleteTouringId !== null && (
        <TouringDeleteConfirmModal
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  )
}

export default withAuth(TouringsPage)
