'use client'

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import type {
  ApiResponseTouringDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { InfoBox } from '@/components/bike/InfoBox'
import { TouringListSection } from '@/components/touring/TouringListSection'
import { authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function TouringsPage() {
  const params = useParams()
  const router = useRouter()
  const bikeId = params.id as string

  const {
    data: tourings,
    error,
    isLoading,
  } = useSWR(
    bikeId
      ? `/api/v1/user-bike/bike/${bikeId}/tourings?sort-by=start-date&sort-order=desc`
      : null,
    async (url: string) => {
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
  )

  // 表示順: PLANNED (予定日昇順) → STARTED → COMPLETED (開始日降順)
  const sortedTourings = tourings
    ? [...tourings].sort((a, b) => {
        const order = { PLANNED: 0, STARTED: 1, COMPLETED: 2 }
        const statusDiff = order[a.status] - order[b.status]
        if (statusDiff !== 0) return statusDiff
        if (a.status === 'PLANNED') {
          return (
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          )
        }
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      })
    : []

  const handleDetail = (touringId: string) => {
    router.push(`/app/my-bike/${bikeId}/tourings/${touringId}`)
  }

  const handleRegisterHistory = () => {
    router.push(`/app/my-bike/${bikeId}/tourings/register?mode=history`)
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
        <Button onClick={handleRegisterHistory} variant="primary">
          ツーリングを作成
        </Button>
      </div>

      <InfoBox variant="info" className="w-full max-w-md mt-3 text-sm">
        開始・終了地点の位置情報は本人のみ閲覧でき、他のユーザーには公開されません。
      </InfoBox>

      <div className="w-full max-w-md mt-3">
        <TouringListSection
          tourings={sortedTourings}
          onDetail={handleDetail}
          onRegister={handleRegisterHistory}
        />
      </div>
    </>
  )
}

export default withAuth(TouringsPage)
