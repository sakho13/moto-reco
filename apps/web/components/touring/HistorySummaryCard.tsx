'use client'

import type { ApiResponseTouringDetail } from '@repo/shared-types'
import { formatDate } from '@repo/shared-utils'
import styles from './HistorySummaryCard.module.css'

export interface HistorySummaryCardProps {
  touring: ApiResponseTouringDetail
  onClick?: (touringId: string) => void
}

/**
 * プラン詳細画面の履歴セクションで表示するツーリング実績の概要カード
 *
 * @remarks
 * タイトル・実施日・走行距離・ステータスバッジを表示する。
 * `PLANNED` ステータスは存在しないため `STARTED`/`COMPLETED` のみを扱う。
 */
export const HistorySummaryCard = ({
  touring,
  onClick,
}: HistorySummaryCardProps) => {
  const distance =
    touring.startMileage !== null && touring.endMileage !== null
      ? touring.endMileage - touring.startMileage
      : null

  return (
    <div
      className={`${styles.item} ${onClick ? styles.itemClickable : ''}`}
      onClick={() => onClick?.(touring.touringId)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(touring.touringId)
              }
            }
          : undefined
      }
    >
      <div className={styles.mainRow}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{touring.title}</h3>
          <span
            className={
              touring.status === 'STARTED'
                ? styles.statusBadgeStarted
                : styles.statusBadgeCompleted
            }
          >
            {touring.status === 'STARTED' ? '進行中' : '完了'}
          </span>
        </div>
        <span className={styles.chevron}>›</span>
      </div>

      <div className={styles.periodRow}>
        <span>{formatDate(touring.startDate)}</span>
      </div>

      {distance !== null && (
        <div className={styles.detailsRow}>
          <span>走行距離: {distance.toLocaleString()}km</span>
        </div>
      )}
    </div>
  )
}
