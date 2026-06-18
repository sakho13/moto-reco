'use client'

import type { ApiResponseMaintenanceLogDetail } from '@repo/shared-types'
import { formatInUserTimezone } from '@repo/shared-utils'
import styles from './MaintenanceLogItem.module.css'
import { ClickableListCard } from '@/components/ClickableListCard'
import { MAINTENANCE_ITEMS_MASTER } from '@/lib/api/server/constants/maintenanceItems'
import { useUserTimezone } from '@/lib/hooks/useUserTimezone'

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
  const timezone = useUserTimezone()
  const formatDate = (dateString: string) => {
    try {
      return formatInUserTimezone(dateString, timezone, 'yyyy年MM月dd日')
    } catch {
      return dateString
    }
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
