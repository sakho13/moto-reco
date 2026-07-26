'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import type {
  ApiResponseUserBikeDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { formatDate } from '@repo/shared-utils'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { MyBikeEditModal } from '@/components/bike/MyBikeEditModal'
import { AttachedGoodsSection } from '@/components/goods/AttachedGoodsSection'
import { EditIcon } from '@/components/icons/EditIcon'
import { FuelIcon } from '@/components/icons/FuelIcon'
import { GoodsIcon } from '@/components/icons/GoodsIcon'
import { TouringIcon } from '@/components/icons/TouringIcon'
import { WrenchIcon } from '@/components/icons/WrenchIcon'
import { NavigationCard } from '@/components/NavigationCard'
import { BikePhotosCard } from '@/components/photo/BikePhotosCard'
import { apiGet, authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function BikeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const { data: profile } = useSWR('/api/v1/user/profile', async (url) => {
    const response = await apiGet(url)
    return response.data
  })
  const isAdmin = profile?.role === 'ADMIN'

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
        <div className="flex items-center justify-center min-h-100">
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
          <Button onClick={() => router.push('/app/home')} variant="cloud">
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
          <Button onClick={() => router.push('/app/home')}>ホームに戻る</Button>
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
      {isEditModalOpen && (
        <MyBikeEditModal
          bikeId={id}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false)
            mutate(`/api/v1/user-bike/bike/${id}`)
          }}
        />
      )}

      <div className="w-full max-w-md mb-4">
        <Button variant="cloud" onClick={() => router.push('/app/my-bike')}>
          ← 戻る
        </Button>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        <BaseCard
          title={displayTitle}
          headerAction={
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="cloud"
              size="sm"
              aria-label="バイク情報を編集"
            >
              <EditIcon />
            </Button>
          }
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm select-none">
            <span>総走行距離: {bike.totalMileage.toLocaleString()}km</span>
            <span>
              排気量: {bike.displacement ? `${bike.displacement}cc` : '不明'}
            </span>
            <span>
              購入日:{' '}
              {bike.purchaseDate ? formatDate(bike.purchaseDate) : '未設定'}
            </span>
            <span>給油回数: {bike.fuelLogCount}回</span>
            <span>ツーリング回数: {bike.touringCount}回</span>
          </div>
        </BaseCard>

        {isAdmin && <BikePhotosCard myUserBikeId={id} />}

        <AttachedGoodsSection myUserBikeId={id} />
      </div>

      {/* 履歴管理セクション */}
      <div className="w-full max-w-md flex flex-col gap-4 mb-20">
        <NavigationCard
          href={`/app/my-bike/${id}/fuel-logs`}
          title="給油履歴"
          description="給油履歴を確認・管理できます"
          icon={<FuelIcon />}
        />

        <NavigationCard
          href={`/app/my-bike/${id}/tourings`}
          title="ツーリング"
          description="ツーリング履歴・プランを確認・管理できます"
          icon={<TouringIcon />}
        />

        <NavigationCard
          href={`/app/my-bike/${id}/maintenance-logs`}
          title="メンテナンス履歴"
          description="メンテナンス履歴を確認・管理できます"
          icon={<WrenchIcon />}
        />

        <NavigationCard
          href="/app/goods"
          title="グッズ"
          description="登録した購入グッズを一覧で確認できます"
          icon={<GoodsIcon />}
        />
      </div>
    </>
  )
}

export default withAuth(BikeDetailPage)
