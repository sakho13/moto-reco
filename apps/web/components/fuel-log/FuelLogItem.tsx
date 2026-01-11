'use client'

import type { ApiResponseFuelLogDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './FuelLogItem.module.css'

export interface FuelLogItemProps {
  fuelLog: ApiResponseFuelLogDetail
  onEdit: (fuelLogId: string) => void
}

export const FuelLogItem = ({ fuelLog, onEdit }: FuelLogItemProps) => {
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

  return (
    <div className={styles.item}>
      <div className={styles.header}>
        <div>
          <p className={styles.date}>{formatDate(fuelLog.refueledAt)}</p>
          <p className={styles.mileage}>
            走行距離: {fuelLog.mileage.toLocaleString()} km
          </p>
        </div>
        <Button
          onClick={() => onEdit(fuelLog.fuelLogId)}
          variant="cloud"
          size="sm"
        >
          編集
        </Button>
      </div>

      <dl className={styles.dataGrid}>
        <dt className={styles.label}>給油量:</dt>
        <dd className={styles.value}>{fuelLog.amount.toFixed(2)} L</dd>

        <dt className={styles.label}>給油価格:</dt>
        <dd className={styles.value}>¥{fuelLog.totalPrice.toLocaleString()}</dd>
      </dl>
    </div>
  )
}
