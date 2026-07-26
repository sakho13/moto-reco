'use client'

import { useRouter } from 'next/navigation'
import useSWRInfinite from 'swr/infinite'
import type {
  ApiResponseUserGoodsList,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { GoodsListSection } from '@/components/goods/GoodsListSection'
import { authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
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

  const { data, error, isLoading, size, setSize, isValidating } =
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
          <Button onClick={() => router.push('/app/home')} variant="cloud">
            ← 戻る
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h1 className="text-2xl font-bold mb-4 text-red-600">エラー</h1>
          <p className="text-gray-700 mb-4">
            {error instanceof ApiV1Error
              ? error.message
              : 'グッズ一覧の取得に失敗しました'}
          </p>
          <Button onClick={() => router.push('/app/home')}>
            ホームに戻る
          </Button>
        </div>
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
        <Button variant="cloud" onClick={() => router.push('/app/home')}>
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
        />
      </div>
    </>
  )
}

export default withAuth(GoodsPage)
