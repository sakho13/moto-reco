'use client'

import type { ApiResponseTouringDetail } from '@repo/shared-types'
import styles from './TouringListItem.module.css'

export interface TouringListItemProps {
  touring: ApiResponseTouringDetail
  onDetail?: (touringId: string) => void
}

export const TouringListItem = ({
  touring,
  onDetail,
}: TouringListItemProps) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
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
              touring.status === 'PLANNED'
                ? styles.statusBadgePlanned
                : touring.status === 'STARTED'
                  ? styles.statusBadgeStarted
                  : styles.statusBadgeCompleted
            }
          >
            {touring.status === 'PLANNED'
              ? 'プラン'
              : touring.status === 'STARTED'
                ? '進行中'
                : '完了'}
          </span>
        </div>
        <span className={styles.chevron}>›</span>
      </div>

      <div className={styles.periodRow}>
        <span>
          {touring.status === 'PLANNED' ? '予定: ' : ''}
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
