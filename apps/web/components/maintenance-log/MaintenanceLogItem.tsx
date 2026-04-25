'use client'

import type { ApiResponseMaintenanceLogDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './MaintenanceLogItem.module.css'
import { MAINTENANCE_ITEMS_MASTER } from '@/lib/api/server/constants/maintenanceItems'

type MaintenanceLogItemProps = {
  log: ApiResponseMaintenanceLogDetail
  onEdit: (maintenanceLogId: string) => void
}

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

const getTypeName = (type: string): string => {
  return (
    MAINTENANCE_ITEMS_MASTER.find((item) => item.type === type)?.typeName ??
    type
  )
}

export const MaintenanceLogItem = ({
  log,
  onEdit,
}: MaintenanceLogItemProps) => {
  return (
    <div className={styles.item}>
      <div className={styles.mainRow}>
        <div className={styles.dateBlock}>
          <span className={styles.date}>{formatDate(log.performedAt)}</span>
          <span className={styles.mileage}>
            {log.mileage.toLocaleString()}km
          </span>
        </div>

        <Button
          onClick={() => onEdit(log.maintenanceLogId)}
          variant="cloud"
          size="sm"
        >
          編集
        </Button>
      </div>

      <div className={styles.itemsRow}>
        {log.items.map((item) => (
          <span key={item.maintenanceType} className={styles.tag}>
            {getTypeName(item.maintenanceType)}
          </span>
        ))}
      </div>

      {log.memo && (
        <div className={styles.memoRow}>
          <span className={styles.memoLabel}>メモ:</span>
          <span className={styles.memoText}>{log.memo}</span>
        </div>
      )}
    </div>
  )
}
