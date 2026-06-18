'use client'

import type { ApiResponseTouringDetail } from '@repo/shared-types'
import { formatInUserTimezone } from '@repo/shared-utils'
import styles from './TouringListItem.module.css'
import { useUserTimezone } from '@/lib/hooks/useUserTimezone'

export interface TouringListItemProps {
  touring: ApiResponseTouringDetail
  onDetail?: (touringId: string) => void
}

export const TouringListItem = ({
  touring,
  onDetail,
}: TouringListItemProps) => {
  const timezone = useUserTimezone()
  const formatDate = (dateString: string) => {
    try {
      return formatInUserTimezone(dateString, timezone, 'yyyy年MM月dd日')
    } catch {
      return dateString
    }
  }

  const calculateDistance = () => {
    if (touring.startMileage !== null && touring.endMileage !== null) {
      return touring.endMileage - touring.startMileage
    }
    return null
  }

  const distance = calculateDistance()

  return (
    <div
      className={`${styles.item} ${onDetail ? styles.itemClickable : ''}`}
      onClick={() => onDetail?.(touring.touringId)}
      role={onDetail ? 'button' : undefined}
      tabIndex={onDetail ? 0 : undefined}
      onKeyDown={
        onDetail
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onDetail(touring.touringId)
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
        <span>
          {formatDate(touring.startDate)} 〜 {formatDate(touring.endDate)}
        </span>
      </div>

      {distance !== null && (
        <div className={styles.detailsRow}>
          <span>走行距離: {distance.toLocaleString()}km</span>
          {touring.startMileage !== null && (
            <>
              <span className={styles.separator}>|</span>
              <span>
                {touring.startMileage.toLocaleString()}km →{' '}
                {touring.endMileage?.toLocaleString()}km
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
