'use client'

import { useRouter } from 'next/navigation'
import useSWRInfinite from 'swr/infinite'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseUserGoodsList,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { GoodsListSection } from '@/components/goods/GoodsListSection'
import { authenticatedFetch } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'

function GoodsPage() {
  const router = useRouter()

  const fetchUserGoods = async (url: string) => {
    const response = await authenticatedFetch(url, { method: 'GET' })
    if (!response.ok) {
      const errorData = await response.json()
      throw new ApiV1Error(
        errorData.errorCode || 'SERVER_ERROR',
        errorData.message || 'エラーが発生しました'
      )
    }
    const json =
      (await response.json()) as SuccessResponse<ApiResponseUserGoodsList>
    return json.data
  }

  const { data, error, isLoading, size, setSize, isValidating, mutate } =
    useSWRInfinite(
      (pageIndex) => `/api/v1/user-goods?per-size=10&page=${pageIndex + 1}`,
      fetchUserGoods,
      { keepPreviousData: true }
    )

  const handleRegister = () => {
    router.push('/app/goods/catalog')
  }

  const handleLoadMore = () => {
    setSize(size + 1)
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
          <Button onClick={() => router.push('/app/my-bike')} variant="cloud">
            ← 戻る
          </Button>
        </div>

        <BaseCard title="エラー">
          <ErrorMessage>
            {error instanceof ApiV1Error
              ? error.message
              : 'グッズ一覧の取得に失敗しました'}
          </ErrorMessage>
          <Button onClick={() => router.push('/app/my-bike')}>
            マイバイク一覧に戻る
          </Button>
        </BaseCard>
      </div>
    )
  }

  const goodsList = data ? data.filter(Boolean).flat() : []
  const lastPageCount = data?.[data.length - 1]?.length ?? 0
  const canLoadMore = lastPageCount === 10
  const isLoadingMore = isValidating && !isLoading && size > 0

  return (
    <>
      <div className="w-full max-w-md mb-4">
        <Button variant="cloud" onClick={() => router.push('/app/my-bike')}>
          ← 戻る
        </Button>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4 mb-20">
        <GoodsListSection
          title="グッズ一覧"
          testId="goods-section"
          goodsList={goodsList}
          onRegister={handleRegister}
          onLoadMore={handleLoadMore}
          canLoadMore={canLoadMore}
          isLoadingMore={isLoadingMore}
          onChanged={() => mutate()}
        />
      </div>
    </>
  )
}

export default withAuth(GoodsPage)
