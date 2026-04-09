'use client'

import { Fuel, MapPin } from 'lucide-react'
import { useEffect, useRef } from 'react'
import useSWRInfinite from 'swr/infinite'
import type {
  ApiResponseAllBikesHistoryList,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import styles from './page.module.css'
import { authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

const PAGE_SIZE = 10

function HistoryPage() {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

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
              <div
                key={`${item.type}-${item.occurredAt}-${item.type === 'FUEL_LOG' ? item.fuelLog.fuelLogId : item.touring.touringId}`}
                className={styles.historyItem}
              >
                <div className={styles.header}>
                  <div className={styles.badges}>
                    <span
                      className={`${styles.badge} ${item.type === 'FUEL_LOG' ? styles.badgeFuel : styles.badgeTouring}`}
                    >
                      {item.type === 'FUEL_LOG' ? (
                        <>
                          <Fuel size={12} />
                          給油
                        </>
                      ) : (
                        <>
                          <MapPin size={12} />
                          ツーリング
                        </>
                      )}
                    </span>
                    <span className={styles.bikeName}>{item.bikeName}</span>
                  </div>
                  <span className={styles.date}>
                    {formatDate(item.occurredAt)}
                  </span>
                </div>

                {item.type === 'FUEL_LOG' ? (
                  <div className={styles.detail}>
                    <div>
                      走行距離: {item.fuelLog.mileage.toLocaleString()} km
                    </div>
                    <div>
                      給油量: {item.fuelLog.amount.toLocaleString()} L /{' '}
                      {item.fuelLog.totalPrice.toLocaleString()} 円
                    </div>
                  </div>
                ) : (
                  <div className={styles.detail}>
                    <div>{item.touring.title}</div>
                    <div>
                      {new Date(item.touring.startDate).toLocaleDateString(
                        'ja-JP'
                      )}{' '}
                      〜{' '}
                      {new Date(item.touring.endDate).toLocaleDateString(
                        'ja-JP'
                      )}
                    </div>
                  </div>
                )}
              </div>
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
    </div>
  )
}

export default withAuth(HistoryPage)
