'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import useSWRInfinite from 'swr/infinite'
import type {
  ApiResponseAllBikesHistoryList,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import styles from './page.module.css'
import { FuelLogEditModal } from '@/components/fuel-log/FuelLogEditModal'
import { HistoryItemCard } from '@/components/history/HistoryItemCard'
import { authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

const PAGE_SIZE = 10

function HistoryPage() {
  const router = useRouter()
  const [editingFuelLog, setEditingFuelLog] = useState<{
    bikeId: string
    fuelLogId: string
  } | null>(null)

  const fetchHistory = async (url: string) => {
    const response = await authenticatedFetch(url, { method: 'GET' })
    if (!response.ok) {
      const errorData = await response.json()
      throw new ApiV1Error(
        errorData.errorCode || 'SERVER_ERROR',
        errorData.message || 'エラーが発生しました'
      )
    }
    const json =
      (await response.json()) as SuccessResponse<ApiResponseAllBikesHistoryList>
    return json.data
  }

  const { data, error, isLoading, size, setSize, isValidating } =
    useSWRInfinite(
      (pageIndex) =>
        `/api/v1/user-bike/history?per-size=${PAGE_SIZE}&page=${pageIndex + 1}`,
      fetchHistory
    )

  const historyItems = data ? data.flat() : []
  const lastPageCount = data?.[data.length - 1]?.length ?? 0
  const canLoadMore = lastPageCount === PAGE_SIZE
  const isLoadingMore = isValidating && !isLoading && size > 0

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!sentinelRef.current || !canLoadMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          setSize((s) => s + 1)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [canLoadMore, isLoadingMore, setSize])

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
      <div className="w-full max-w-2xl">
        <div className={styles.errorCard}>
          <h1 className={styles.errorTitle}>エラー</h1>
          <p className={styles.errorMessage}>
            {error instanceof ApiV1Error
              ? error.message
              : 'ヒストリーの取得に失敗しました'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <BaseCard title="ヒストリー">
        {historyItems.length > 0 ? (
          <div className={styles.historyList}>
            {historyItems.map((item) => (
              <HistoryItemCard
                key={`${item.type}-${item.occurredAt}-${item.type === 'FUEL_LOG' ? item.fuelLog.fuelLogId : item.type === 'TOURING' ? item.touring.touringId : item.post.postId}`}
                item={item}
                onClick={
                  item.type === 'FUEL_LOG'
                    ? () =>
                        setEditingFuelLog({
                          bikeId: item.bikeId,
                          fuelLogId: item.fuelLog.fuelLogId,
                        })
                    : item.type === 'TOURING'
                      ? () =>
                          router.push(
                            `/app/my-bike/${item.bikeId}/tourings/${item.touring.touringId}`
                          )
                      : undefined
                }
              />
            ))}
            <div ref={sentinelRef} />
            {isLoadingMore && (
              <p className={styles.loadingMore}>読み込み中...</p>
            )}
          </div>
        ) : (
          <p className={styles.empty}>ヒストリーはまだありません</p>
        )}
      </BaseCard>
      {editingFuelLog && (
        <FuelLogEditModal
          bikeId={editingFuelLog.bikeId}
          fuelLogId={editingFuelLog.fuelLogId}
          onClose={() => setEditingFuelLog(null)}
          onSuccess={() => {
            setEditingFuelLog(null)
            setSize(1)
          }}
        />
      )}
    </div>
  )
}

export default withAuth(HistoryPage)
