'use client'

import type { ApiResponseMaintenanceLogDetail } from '@repo/shared-types'
import styles from './MaintenanceLogItem.module.css'
import { ClickableListCard } from '@/components/ClickableListCard'
import { MAINTENANCE_ITEMS_MASTER } from '@/lib/api/server/constants/maintenanceItems'

type MaintenanceLogItemProps = {
  log: ApiResponseMaintenanceLogDetail
  onEdit: (maintenanceLogId: string) => void
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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <ClickableListCard onClick={() => onEdit(log.maintenanceLogId)}>
      <div className={styles.dateBlock}>
        <span className={styles.date}>{formatDate(log.performedAt)}</span>
        <span className={styles.mileage}>{log.mileage.toLocaleString()}km</span>
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
    </ClickableListCard>
  )
}
