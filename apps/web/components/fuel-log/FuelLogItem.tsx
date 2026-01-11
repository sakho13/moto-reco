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
        {/* 燃費表示エリア */}
        <div className={styles.fuelEfficiencyArea}>
          {fuelLog.fuelEfficiency !== null ? (
            <>
              <div className={styles.fuelEfficiency}>
                {fuelLog.fuelEfficiency.toFixed(1)}{' '}
                <span className={styles.unit}>km/L</span>
              </div>
              {fuelLog.pricePerLiter !== null && (
                <div className={styles.pricePerLiter}>
                  ¥{Math.round(fuelLog.pricePerLiter)}/L
                </div>
              )}
            </>
          ) : (
            <div className={styles.initialRefuel}>初回給油</div>
          )}
        </div>

        <Button
          onClick={() => onEdit(fuelLog.fuelLogId)}
          variant="cloud"
          size="sm"
        >
          編集
        </Button>
      </div>

      {/* 詳細情報 */}
      <div className={styles.details}>
        <p className={styles.date}>{formatDate(fuelLog.refueledAt)}</p>
        <dl className={styles.dataGrid}>
          <dt className={styles.label}>走行距離:</dt>
          <dd className={styles.value}>
            {fuelLog.mileage.toLocaleString()} km
          </dd>

          <dt className={styles.label}>給油量:</dt>
          <dd className={styles.value}>{fuelLog.amount.toFixed(2)} L</dd>

          <dt className={styles.label}>給油価格:</dt>
          <dd className={styles.value}>
            ¥{fuelLog.totalPrice.toLocaleString()}
          </dd>
        </dl>
      </div>
    </div>
  )
}
