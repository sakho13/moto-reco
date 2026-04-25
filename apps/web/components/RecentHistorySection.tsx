'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import type {
  ApiResponseAllBikesHistoryList,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { FuelLogEditModal } from './fuel-log/FuelLogEditModal'
import { HistoryItemCard } from './history/HistoryItemCard'
import styles from './RecentHistorySection.module.css'
import { authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

const PAGE_SIZE = 5

export const RecentHistorySection = () => {
  const router = useRouter()
  const [editingFuelLog, setEditingFuelLog] = useState<{
    bikeId: string
    fuelLogId: string
  } | null>(null)

  const { data, error, isLoading } = useSWR(
    `/api/v1/user-bike/history?page=1&per-size=${PAGE_SIZE}`,
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

  const moreLink = (
    <Link href="/app/history" className={styles.moreLink}>
      もっと見る →
    </Link>
  )

  if (isLoading) {
    return (
      <BaseCard title="ヒストリー" headerAction={moreLink} noBorder>
        <p className={styles.empty}>読み込み中...</p>
      </BaseCard>
    )
  }

  if (error) {
    return null
  }

  const historyItems = data ?? []

  return (
    <BaseCard title="ヒストリー" headerAction={moreLink} noBorder>
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
        </div>
      ) : (
        <p className={styles.empty}>ヒストリーはまだありません</p>
      )}
      {editingFuelLog && (
        <FuelLogEditModal
          bikeId={editingFuelLog.bikeId}
          fuelLogId={editingFuelLog.fuelLogId}
          onClose={() => setEditingFuelLog(null)}
          onSuccess={() => setEditingFuelLog(null)}
        />
      )}
    </BaseCard>
  )
}
