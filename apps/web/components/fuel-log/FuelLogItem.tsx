'use client'

import { Map } from 'lucide-react'
import type { ApiResponseFuelLogDetail } from '@repo/shared-types'
import { ClickableListCard } from '@/components/ClickableListCard'
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
    <ClickableListCard onClick={() => onEdit(fuelLog.fuelLogId)}>
      {/* 行1: メイン情報（燃費・総走行距離・日付） */}
      <div className={styles.mainRow}>
        <div className={styles.fuelEfficiency}>
          {fuelLog.fuelEfficiency !== null ? (
            <>
              {fuelLog.fuelEfficiency.toFixed(1)}{' '}
              <span className={styles.unit}>km/L</span>
            </>
          ) : (
            <span className={styles.initialRefuel}>初回給油</span>
          )}
        </div>

        <div className={styles.metaInfo}>
          <span className={styles.totalMileage}>
            {fuelLog.mileage.toLocaleString()}km
          </span>

          <span className={styles.date}>{formatDate(fuelLog.refueledAt)}</span>
        </div>
      </div>

      {/* 行2: 詳細情報（給油量・価格・単価） */}
      <div className={styles.detailsRow}>
        <span>{fuelLog.amount.toFixed(1)}L</span>
        <span className={styles.separator}>|</span>
        <span>¥{fuelLog.totalPrice.toLocaleString()}</span>
        {fuelLog.pricePerLiter !== null && (
          <>
            <span className={styles.separator}>|</span>
            <span>¥{Math.round(fuelLog.pricePerLiter)}/L</span>
          </>
        )}
      </div>

      {fuelLog.memo && (
        <div className={styles.memoRow}>
          <span className={styles.memoLabel}>メモ:</span>
          <span className={styles.memoText}>{fuelLog.memo}</span>
        </div>
      )}

      {fuelLog.touringTitle && (
        <div className={styles.touringRow}>
          <Map size={14} strokeWidth={2} />
          <span className={styles.touringName}>{fuelLog.touringTitle}</span>
        </div>
      )}
    </ClickableListCard>
  )
}
