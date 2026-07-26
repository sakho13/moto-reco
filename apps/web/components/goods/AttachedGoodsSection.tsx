'use client'

import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import type {
  ApiResponseUserGoodsList,
  SuccessResponse,
} from '@repo/shared-types'
import { GoodsListSection } from './GoodsListSection'
import { authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

type Props = {
  myUserBikeId: string
}

/**
 * マイバイク詳細ページに差し込む「取り付けアクセサリ」セクション
 *
 * @remarks
 * バイクに紐づく購入グッズ一覧を表示する。1バイクあたりの登録点数はそこまで
 * 多くない想定のため、ページングは行わず `per-size=50` で1ページのみ表示する。
 */
export function AttachedGoodsSection({ myUserBikeId }: Props) {
  const router = useRouter()

  const { data } = useSWR(
    `/api/v1/user-goods?myUserBikeId=${myUserBikeId}&per-size=50`,
    async (url: string) => {
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
  )

  const handleRegister = () => {
    router.push(`/app/goods/catalog?myUserBikeId=${myUserBikeId}`)
  }

  return (
    <GoodsListSection
      title="取り付けアクセサリ"
      testId="attached-goods-section"
      goodsList={data ?? []}
      onRegister={handleRegister}
      emptyMessage="取り付けアクセサリがまだ登録されていません"
    />
  )
}
