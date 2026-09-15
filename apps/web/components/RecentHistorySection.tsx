'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FuelLogEditModal } from './fuel-log/FuelLogEditModal'
import { RecentRecordRow } from './home/RecentRecordRow'
import styles from './RecentHistorySection.module.css'
import { useActiveBike } from '@/lib/hooks/useActiveBike'
import { useBikeHistory } from '@/lib/hooks/useBikeHistory'

const RECENT_COUNT = 5

/**
 * ホーム「最近の記録」セクション
 *
 * @remarks
 * アクティブ車両のヒストリーを対象に、走行距離・給油量・金額という入力値ではなく
 * 燃費（給油）・区間距離（ツーリング）という導出値を主役にして一覧表示する
 * （Issue #575「03 再設計の原則」「04 画面案」）。
 */
export const RecentHistorySection = () => {
  const router = useRouter()
  const { activeBike } = useActiveBike()
  const bikeId = activeBike?.myUserBikeId ?? null

  const [editingFuelLogId, setEditingFuelLogId] = useState<string | null>(
    null
  )

  const { data, error, isLoading } = useBikeHistory(bikeId)

  const moreLink = (
    <Link href="/app/history" className={styles.moreLink}>
      もっと見る →
    </Link>
  )

  if (error) {
    return null
  }

  const historyItems = (data ?? []).slice(0, RECENT_COUNT)

  return (
    <section className={styles.section} data-testid="history-section">
      <div className={styles.header}>
        <h2 className={styles.title}>最近の記録</h2>
        {moreLink}
      </div>

      {isLoading ? (
        <p className={styles.empty}>読み込み中...</p>
      ) : historyItems.length > 0 ? (
        <div className={styles.historyList}>
          {historyItems.map((item) => (
            <RecentRecordRow
              key={`${item.type}-${item.occurredAt}-${item.type === 'FUEL_LOG' ? item.fuelLog.fuelLogId : item.touring.touringId}`}
              item={item}
              onClick={
                item.type === 'FUEL_LOG'
                  ? () => setEditingFuelLogId(item.fuelLog.fuelLogId)
                  : () =>
                      router.push(
                        `/app/my-bike/${bikeId}/tourings/${item.touring.touringId}`
                      )
              }
            />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>ヒストリーはまだありません</p>
      )}

      {editingFuelLogId && bikeId && (
        <FuelLogEditModal
          bikeId={bikeId}
          fuelLogId={editingFuelLogId}
          onClose={() => setEditingFuelLogId(null)}
          onSuccess={() => setEditingFuelLogId(null)}
        />
      )}
    </section>
  )
}
