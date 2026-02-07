'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import type {
  ApiResponseTouringDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { EditIcon } from '@/components/icons/EditIcon'
import { authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function TouringDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const touringId = params.touringId as string
  const bikeId = searchParams.get('bikeId') ?? ''

  const detailUrl =
    bikeId && touringId
      ? `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}`
      : null

  const {
    data: touring,
    error,
    isLoading,
  } = useSWR(detailUrl, async (url) => {
    const response = await authenticatedFetch(url, { method: 'GET' })
    if (!response.ok) {
      const errorData = await response.json()
      throw new ApiV1Error(
        errorData.errorCode || 'SERVER_ERROR',
        errorData.message || 'エラーが発生しました'
      )
    }
    const json =
      (await response.json()) as SuccessResponse<ApiResponseTouringDetail>
    return json.data
  })

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const formatMileage = (mileage: number | null) => {
    if (mileage === null) {
      return '未入力'
    }
    return `${mileage.toLocaleString()} km`
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-center min-h-100">
          <p className="text-lg">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !touring) {
    return (
      <div className="w-full max-w-xl">
        <div className="mb-4">
          <Button
            onClick={() => router.push(`/app/tourings?bikeId=${bikeId}`)}
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
              : 'ツーリング記録が見つかりません'}
          </p>
          <Button onClick={() => router.push(`/app/tourings?bikeId=${bikeId}`)}>
            ツーリング記録一覧に戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl flex flex-col gap-4">
      <div className="w-full">
        <Button
          onClick={() => router.push(`/app/tourings?bikeId=${bikeId}`)}
          variant="cloud"
        >
          ← 戻る
        </Button>
      </div>

      <BaseCard
        title={touring.title}
        headerAction={
          <Button
            onClick={() =>
              router.push(`/app/tourings/${touringId}/edit?bikeId=${bikeId}`)
            }
            variant="cloud"
            size="sm"
            aria-label="ツーリング記録を編集"
          >
            <EditIcon />
          </Button>
        }
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-gray-500">期間</dt>
          <dd>
            {formatDate(touring.startDate)} 〜 {formatDate(touring.endDate)}
          </dd>
          <dt className="text-gray-500">開始時の総走行距離</dt>
          <dd>{formatMileage(touring.startMileage)}</dd>
          <dt className="text-gray-500">終了時の総走行距離</dt>
          <dd>{formatMileage(touring.endMileage)}</dd>
        </dl>
      </BaseCard>
    </div>
  )
}

export default withAuth(TouringDetailPage)
