'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import type {
  ApiResponseGoodsModelSearch,
  GoodsCategory,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Select, type SelectOption } from '@repo/ui/select'
import styles from './page.module.css'
import { GoodsCatalogItem } from '@/components/goods/GoodsCatalogItem'
import {
  GOODS_CATEGORY_LABELS,
  GOODS_CATEGORY_ORDER,
} from '@/components/goods/goodsCategoryLabels'
import { GoodsPurchaseModal } from '@/components/goods/GoodsPurchaseModal'
import { apiGet, authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

type GoodsModel = ApiResponseGoodsModelSearch['models'][number]

function GoodsCatalogPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const myUserBikeIdFromQuery = searchParams.get('myUserBikeId') ?? undefined

  const [manufacturerId, setManufacturerId] = useState('')
  const [category, setCategory] = useState<GoodsCategory | ''>('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [selectedModel, setSelectedModel] = useState<GoodsModel | null>(null)

  // キーワード入力をデバウンスして確定値へ反映する
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(keywordInput.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [keywordInput])

  const { data: manufacturers } = useSWR(
    '/api/v1/goods/manufacturers',
    async (url) => {
      const response = await apiGet(url)
      return response.data.manufacturers
    }
  )

  const fetchModels = async (url: string) => {
    const response = await authenticatedFetch(url, { method: 'GET' })
    if (!response.ok) {
      const errorData = await response.json()
      throw new ApiV1Error(
        errorData.errorCode || 'SERVER_ERROR',
        errorData.message || 'エラーが発生しました'
      )
    }
    const json =
      (await response.json()) as SuccessResponse<ApiResponseGoodsModelSearch>
    return json.data.models
  }

  const { data, error, isLoading, size, setSize, isValidating } =
    useSWRInfinite(
      (pageIndex) =>
        `/api/v1/goods/models?per-size=20&page=${pageIndex + 1}${
          manufacturerId ? `&manufacturerId=${manufacturerId}` : ''
        }${category ? `&category=${category}` : ''}${
          keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''
        }`,
      fetchModels,
      { keepPreviousData: true }
    )

  // フィルタが変わったらページをリセットする
  useEffect(() => {
    setSize(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manufacturerId, category, keyword])

  const manufacturerOptions: SelectOption[] = [
    { value: '', label: 'すべてのメーカー' },
    ...(manufacturers ?? []).map((m) => ({
      value: m.goodsManufacturerId,
      label: m.name,
    })),
  ]

  const categoryOptions: SelectOption[] = [
    { value: '', label: 'すべてのカテゴリ' },
    ...GOODS_CATEGORY_ORDER.map((c) => ({
      value: c,
      label: GOODS_CATEGORY_LABELS[c],
    })),
  ]

  const models = data ? data.filter(Boolean).flat() : []
  const lastPageCount = data?.[data.length - 1]?.length ?? 0
  const canLoadMore = lastPageCount === 20
  const isLoadingMore = isValidating && !isLoading && size > 0

  const handleLoadMore = () => {
    setSize(size + 1)
  }

  return (
    <>
      {selectedModel && (
        <GoodsPurchaseModal
          model={selectedModel}
          defaultMyUserBikeId={myUserBikeIdFromQuery}
          onClose={() => setSelectedModel(null)}
        />
      )}

      <div className="w-full max-w-md mb-4">
        <Button variant="cloud" onClick={() => router.push('/app/goods')}>
          ← 戻る
        </Button>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4 mb-20">
        <BaseCard
          title="グッズカタログ検索"
          data-testid="goods-catalog-section"
        >
          <div className={styles.filters}>
            <Select
              id="manufacturerId"
              options={manufacturerOptions}
              value={manufacturerId}
              onChange={(e) => setManufacturerId(e.target.value)}
            />
            <Select
              id="category"
              options={categoryOptions}
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as GoodsCategory | '')
              }
            />
            <Input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="型番・商品名で検索"
            />
          </div>

          {isLoading && !data ? (
            <div className={styles.emptyState}>
              <p>読み込み中...</p>
            </div>
          ) : error ? (
            <div className={styles.emptyState}>
              <p>
                {error instanceof ApiV1Error
                  ? error.message
                  : 'グッズの検索に失敗しました'}
              </p>
            </div>
          ) : models.length === 0 ? (
            <div className={styles.emptyState}>
              <p>該当するグッズが見つかりませんでした</p>
            </div>
          ) : (
            <div className={styles.listContainer}>
              {models.map((model) => (
                <GoodsCatalogItem
                  key={model.goodsModelId}
                  model={model}
                  onSelect={setSelectedModel}
                />
              ))}
              {canLoadMore && (
                <div className={styles.loadMore}>
                  <Button
                    onClick={handleLoadMore}
                    variant="cloud"
                    loading={isLoadingMore}
                  >
                    もっと見る
                  </Button>
                </div>
              )}
            </div>
          )}
        </BaseCard>
      </div>
    </>
  )
}

const AuthenticatedGoodsCatalogPage = withAuth(GoodsCatalogPage)

export default function GoodsCatalogPageWithSuspense() {
  return (
    <Suspense fallback={<div className="p-4">読み込み中...</div>}>
      <AuthenticatedGoodsCatalogPage />
    </Suspense>
  )
}
