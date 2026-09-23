'use client'

import type { ApiResponseMaintenanceLogDetail } from '@repo/shared-types'
import styles from './MaintenanceLedgerList.module.css'
import { MAINTENANCE_ITEMS_MASTER } from '@/lib/api/server/constants/maintenanceItems'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function formatWeekday(dateString: string): string {
  return WEEKDAYS[new Date(dateString).getDay()] ?? ''
}

function formatMonthDay(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function getTypeName(type: string): string {
  return (
    MAINTENANCE_ITEMS_MASTER.find((item) => item.type === type)?.typeName ??
    type
  )
}

type MaintenanceLedgerRowProps = {
  log: ApiResponseMaintenanceLogDetail
  onSelect: (maintenanceLogId: string) => void
}

function MaintenanceLedgerRow({ log, onSelect }: MaintenanceLedgerRowProps) {
  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.row}
        onClick={() => onSelect(log.maintenanceLogId)}
      >
        <span className={styles.date}>
          <span className={styles.dateWeekday}>
            {formatWeekday(log.performedAt)}
          </span>
          <span className={styles.dateDay}>
            {formatMonthDay(log.performedAt)}
          </span>
        </span>

        <span className={styles.body}>
          <span className={styles.typeLine}>
            {log.items.map((item) => (
              <span key={item.maintenanceType} className={styles.tag}>
                {getTypeName(item.maintenanceType)}
              </span>
            ))}
          </span>
          {log.memo && <span className={styles.detailLine}>{log.memo}</span>}
        </span>

        <span className={styles.value}>
          <span className={styles.valueNumber}>
            {log.mileage.toLocaleString()}
          </span>
          <span className={styles.valueUnit}>km</span>
        </span>
      </button>
    </li>
  )
}

type Props = {
  logs: ApiResponseMaintenanceLogDetail[]
  onSelect: (maintenanceLogId: string) => void
  emptyMessage: string
}

/**
 * メンテナンス履歴の台帳（行リスト）の表示部品（Issue #575「05 画面案 ─ PC」）
 *
 * @remarks
 * `/app/my-bike/{id}/maintenance-logs` のPC版一覧（日付順、
 * `MaintenanceLedgerSection`）から使う。`FuelLedgerList` と同じ罫線区切り・
 * 枠なしの行構成にする。値欄は実施時走行距離（ODO）を明朝で組む
 * （費用はデータモデルに存在しないため出さない）。
 */
export function MaintenanceLedgerList({ logs, onSelect, emptyMessage }: Props) {
  if (logs.length === 0) {
    return <p className={styles.emptyMessage}>{emptyMessage}</p>
  }

  return (
    <div className={styles.table}>
      <div className={styles.countRow} aria-hidden="true">
        <span>{logs.length}件</span>
      </div>
      <ul className={styles.list}>
        {logs.map((log) => (
          <MaintenanceLedgerRow
            key={log.maintenanceLogId}
            log={log}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  )
}
