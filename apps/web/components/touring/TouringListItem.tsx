'use client'

import type { ApiResponseTouringDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './TouringListItem.module.css'
import { TrashIcon } from '@/components/icons/TrashIcon'

export interface TouringListItemProps {
  touring: ApiResponseTouringDetail
  onDetail?: (touringId: string) => void
  onDelete?: (touringId: string) => void
}

export const TouringListItem = ({
  touring,
  onDetail,
  onDelete,
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
    <div className={styles.item}>
      {/* 行1: タイトル・ステータス・編集 */}
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

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onDetail && (
            <Button
              onClick={() => onDetail(touring.touringId)}
              variant="cloud"
              size="sm"
            >
              詳細
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => onDelete(touring.touringId)}
              variant="danger"
              size="sm"
            >
              <TrashIcon />
            </Button>
          )}
        </div>
      </div>

      {/* 行2: 期間 */}
      <div className={styles.periodRow}>
        <span>
          {formatDate(touring.startDate)} 〜 {formatDate(touring.endDate)}
        </span>
      </div>

      {/* 行3: 走行距離情報 */}
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
