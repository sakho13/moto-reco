'use client'

import useSWR from 'swr'
import type {
  ApiResponseAllBikesHistoryList,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import styles from './page.module.css'
import { authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function HistoryPage() {
  const { data, error, isLoading } = useSWR(
    '/api/v1/user-bike/history',
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
        (await response.json()) as SuccessResponse<ApiResponseAllBikesHistoryList>
      return json.data
    }
  )

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
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h1 className="text-2xl font-bold mb-4 text-red-600">エラー</h1>
          <p className="text-gray-700">
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
        {data && data.length > 0 ? (
          <div className={styles.historyList}>
            {data.map((item) => (
              <div
                key={`${item.type}-${item.occurredAt}-${item.type === 'FUEL_LOG' ? item.fuelLog.fuelLogId : item.touring.touringId}`}
                className={styles.historyItem}
              >
                <div className={styles.header}>
                  <div className={styles.badges}>
                    <span
                      className={`${styles.badge} ${item.type === 'FUEL_LOG' ? styles.badgeFuel : styles.badgeTouring}`}
                    >
                      {item.type === 'FUEL_LOG' ? '給油' : 'ツーリング'}
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
          </div>
        ) : (
          <p className={styles.empty}>ヒストリーはまだありません</p>
        )}
      </BaseCard>
    </div>
  )
}

export default withAuth(HistoryPage)
