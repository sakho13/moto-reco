'use client'

import { useRouter } from 'next/navigation'
import useSWRInfinite from 'swr/infinite'
import type {
  ApiResponseUserGoodsList,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { GoodsListSection } from './GoodsListSection'
import { authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

type Props = {
  myUserBikeId: string
}

const PER_SIZE = 20

/**
 * マイバイク詳細ページに差し込む「取り付けアクセサリ」セクション
 *
 * @remarks
 * バイクに紐づく購入グッズ一覧を表示する。件数が多い場合も取りこぼさないよう
 * 一覧ページ（`/app/goods`）と同様に `useSWRInfinite` で追加読み込みする。
 */
export function AttachedGoodsSection({ myUserBikeId }: Props) {
  const router = useRouter()

  const fetchAttachedGoods = async (url: string) => {
    const response = await authenticatedFetch(url, { method: 'GET' })
    if (!response.ok) {
      const errorData = await response.json()
      throw new ApiV1Error(
        errorData.errorCode || 'SERVER_ERROR',
        errorData.message || 'グッズ一覧の取得に失敗しました'
      )
    }
    const json =
      (await response.json()) as SuccessResponse<ApiResponseUserGoodsList>
    return json.data
  }

  const { data, error, isLoading, size, setSize, isValidating, mutate } =
    useSWRInfinite(
      (pageIndex) =>
        `/api/v1/user-goods?myUserBikeId=${myUserBikeId}&per-size=${PER_SIZE}&page=${pageIndex + 1}`,
      fetchAttachedGoods,
      { keepPreviousData: true }
    )

  const handleRegister = () => {
    router.push(`/app/goods/catalog?myUserBikeId=${myUserBikeId}`)
  }

  const handleLoadMore = () => {
    setSize(size + 1)
  }

  if (error) {
    return (
      <BaseCard title="取り付けアクセサリ" data-testid="attached-goods-section">
        <ErrorMessage>
          {error instanceof ApiV1Error
            ? error.message
            : '取り付けアクセサリの取得に失敗しました'}
        </ErrorMessage>
        <Button onClick={() => mutate()} variant="cloud" size="sm">
          再読み込み
        </Button>
      </BaseCard>
    )
  }

  const goodsList = data ? data.filter(Boolean).flat() : []
  const lastPageCount = data?.[data.length - 1]?.length ?? 0
  const canLoadMore = lastPageCount === PER_SIZE
  const isLoadingMore = isValidating && !isLoading && size > 0

  return (
    <GoodsListSection
      title="取り付けアクセサリ"
      testId="attached-goods-section"
      goodsList={goodsList}
      onRegister={handleRegister}
      onLoadMore={handleLoadMore}
      canLoadMore={canLoadMore}
      isLoadingMore={isLoadingMore}
      emptyMessage="取り付けアクセサリがまだ登録されていません"
    />
  )
}
