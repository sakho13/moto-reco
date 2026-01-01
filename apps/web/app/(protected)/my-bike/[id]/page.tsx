'use client'

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import type {
  ApiResponseUserBikeDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { FuelIcon } from '@/components/icons/FuelIcon'
import { WrenchIcon } from '@/components/icons/WrenchIcon'
import { NavigationCard } from '@/components/NavigationCard'
import { authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function BikeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

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

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    const isNotFound =
      error instanceof ApiV1Error && error.errorCode === 'NOT_FOUND'

    return (
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <Button onClick={() => router.push('/home')} variant="cloud">
            ← 戻る
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h1 className="text-2xl font-bold mb-4 text-red-600">
            {isNotFound ? 'バイクが見つかりません' : 'エラー'}
          </h1>
          <p className="text-gray-700 mb-4">
            {isNotFound
              ? '指定されたバイクは存在しないか、削除されています。'
              : error instanceof ApiV1Error
                ? error.message
                : 'バイク情報の取得に失敗しました'}
          </p>
          <Button onClick={() => router.push('/home')}>ホームに戻る</Button>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const bike = data
  const displayTitle =
    bike.nickname ||
    `${bike.manufacturerName || ''} ${bike.modelName || '不明なバイク'}`.trim()

  return (
    <>
      <div className="w-full max-w-md flex items-center justify-between gap-2">
        <Button variant="cloud" onClick={() => router.push('/home')}>
          ← 戻る
        </Button>
        <Button onClick={() => router.push(`/my-bike/${id}/edit`)}>
          編集する
        </Button>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        <BaseCard title={displayTitle}>
          <div className="flex flex-row gap-2 select-none">
            <span>総走行距離: {bike.totalMileage.toLocaleString()}km</span>
            <span>モデル: {bike.modelName || '不明'}</span>
            <span>
              排気量: {bike.displacement ? `${bike.displacement}cc` : '不明'}
            </span>
          </div>
        </BaseCard>
      </div>

      {/* 履歴管理セクション */}
      <div className="w-full max-w-md flex flex-col gap-4">
        <NavigationCard
          href={`/my-bike/${id}/fuel-logs`}
          title="給油履歴"
          description="給油履歴を確認・管理できます"
          icon={<FuelIcon />}
        />

        {/* メンテナンス履歴 - disabled 状態 */}
        <div
          style={{
            opacity: 0.5,
            pointerEvents: 'none',
            cursor: 'not-allowed',
          }}
          aria-disabled="true"
        >
          <NavigationCard
            href="#"
            title="メンテナンス履歴"
            description="準備中です"
            icon={<WrenchIcon />}
          />
        </div>
      </div>
    </>
  )
}

export default withAuth(BikeDetailPage)
