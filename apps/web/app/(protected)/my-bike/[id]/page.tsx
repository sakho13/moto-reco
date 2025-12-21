'use client'

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import type {
  ApiResponseUserBikeDetail,
  SuccessResponse,
} from '@packages/shared-types'
import { Button } from '@packages/ui/button'
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未設定'
    try {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return '未設定'
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4">
        <Button onClick={() => router.push('/home')} variant="cloud">
          ← 戻る
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">
          {displayTitle}
        </h1>

        {/* 基本情報セクション */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
            基本情報
          </h2>
          <dl className="grid grid-cols-1 gap-4">
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="font-medium text-gray-600 sm:w-40">メーカー</dt>
              <dd className="text-gray-900">
                {bike.manufacturerName || '不明'}
              </dd>
            </div>

            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="font-medium text-gray-600 sm:w-40">モデル名</dt>
              <dd className="text-gray-900">{bike.modelName || '不明'}</dd>
            </div>

            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="font-medium text-gray-600 sm:w-40">排気量</dt>
              <dd className="text-gray-900">{bike.displacement}cc</dd>
            </div>

            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="font-medium text-gray-600 sm:w-40">年式</dt>
              <dd className="text-gray-900">
                {bike.modelYear ? `${bike.modelYear}年` : '不明'}
              </dd>
            </div>

            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="font-medium text-gray-600 sm:w-40">
                ニックネーム
              </dt>
              <dd className="text-gray-900">{bike.nickname || '未設定'}</dd>
            </div>
          </dl>
        </section>

        {/* 購入情報セクション */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
            購入情報
          </h2>
          <dl className="grid grid-cols-1 gap-4">
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="font-medium text-gray-600 sm:w-40">購入日</dt>
              <dd className="text-gray-900">{formatDate(bike.purchaseDate)}</dd>
            </div>

            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="font-medium text-gray-600 sm:w-40">購入価格</dt>
              <dd className="text-gray-900">
                {bike.purchasePrice
                  ? `¥${bike.purchasePrice.toLocaleString()}`
                  : '未設定'}
              </dd>
            </div>

            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="font-medium text-gray-600 sm:w-40">
                購入時走行距離
              </dt>
              <dd className="text-gray-900">
                {bike.purchaseMileage
                  ? `${bike.purchaseMileage.toLocaleString()}km`
                  : '未設定'}
              </dd>
            </div>

            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="font-medium text-gray-600 sm:w-40">
                現在の走行距離
              </dt>
              <dd className="text-gray-900">
                {bike.totalMileage.toLocaleString()}km
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}

export default withAuth(BikeDetailPage)
