'use client'

import type { ApiResponseTouringDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './TouringListItem.module.css'

export interface TouringListItemProps {
  touring: ApiResponseTouringDetail
  onEdit: (touringId: string) => void
}

export const TouringListItem = ({ touring, onEdit }: TouringListItemProps) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const formatMileage = (mileage: number | null) => {
    if (mileage === null) {
      return '未入力'
    }
    return `${mileage.toLocaleString()}km`
  }

  return (
    <div className={styles.item}>
      <div className={styles.headerRow}>
        <div>
          <h3 className={styles.title}>{touring.title}</h3>
          <p className={styles.date}>
            {formatDate(touring.startDate)} 〜 {formatDate(touring.endDate)}
          </p>
        </div>
        <Button
          onClick={() => onEdit(touring.touringId)}
          variant="cloud"
          size="sm"
          aria-label={`${touring.title}を編集`}
        >
          編集
        </Button>
      </div>
      <div className={styles.mileageRow}>
        <span>開始: {formatMileage(touring.startMileage)}</span>
        <span>終了: {formatMileage(touring.endMileage)}</span>
      </div>
    </div>
  )
}
