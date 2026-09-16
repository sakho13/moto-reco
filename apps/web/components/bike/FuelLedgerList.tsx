'use client'

import { Map } from 'lucide-react'
import type { ApiResponseFuelLogDetail } from '@repo/shared-types'
import styles from './FuelLedgerList.module.css'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function formatWeekday(dateString: string): string {
  return WEEKDAYS[new Date(dateString).getDay()] ?? ''
}

function formatMonthDay(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

type FuelLedgerRowProps = {
  fuelLog: ApiResponseFuelLogDetail
  onSelect: (fuelLogId: string) => void
}

function FuelLedgerRow({ fuelLog, onSelect }: FuelLedgerRowProps) {
  const interval = Math.max(fuelLog.mileage - fuelLog.previousMileage, 0)

  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.row}
        onClick={() => onSelect(fuelLog.fuelLogId)}
      >
        <span className={styles.date}>
          <span className={styles.dateWeekday}>
            {formatWeekday(fuelLog.refueledAt)}
          </span>
          <span className={styles.dateDay}>
            {formatMonthDay(fuelLog.refueledAt)}
          </span>
        </span>

        <span className={styles.body}>
          <span className={styles.typeLine}>
            <span
              className={
                fuelLog.isFullTank ? styles.tagFull : styles.tagPartial
              }
            >
              {fuelLog.isFullTank ? '満タン' : '継ぎ足し'}
            </span>
          </span>
          <span className={styles.detailLine}>
            {fuelLog.mileage.toLocaleString()}km ／ 区間{' '}
            {interval.toLocaleString()}km ／ {fuelLog.amount.toFixed(1)}L ／ ¥
            {fuelLog.totalPrice.toLocaleString()}
            {fuelLog.pricePerLiter !== null && (
              <> ／ {Math.round(fuelLog.pricePerLiter)}円/L</>
            )}
          </span>
          {fuelLog.memo && (
            <span className={styles.memoLine}>{fuelLog.memo}</span>
          )}
          {fuelLog.touringTitle && (
            <span className={styles.touringLine}>
              <Map size={12} strokeWidth={2} aria-hidden="true" />
              {fuelLog.touringTitle}
            </span>
          )}
        </span>

        <span className={styles.value}>
          {fuelLog.fuelEfficiency !== null ? (
            <>
              <span className={styles.valueNumber}>
                {fuelLog.fuelEfficiency.toFixed(1)}
              </span>
              <span className={styles.valueUnit}>km/L</span>
            </>
          ) : !fuelLog.isFullTank ? (
            <span className={styles.valueNote}>次回に繰越</span>
          ) : (
            <span className={styles.valueNoteMuted}>初回給油</span>
          )}
        </span>
      </button>
    </li>
  )
}

type Props = {
  fuelLogs: ApiResponseFuelLogDetail[]
  onSelect: (fuelLogId: string) => void
  emptyMessage: string
}

/**
 * 給油の台帳（行リスト）の共通表示部品（Issue #575「05 画面案 ─ PC」）
 *
 * @remarks
 * 愛車のカルテ内の抜粋（`BikeFuelLedgerExcerpt`）と、給油履歴ページのPC版
 * 一覧（`FuelLedgerSection`）の両方から使う。枠線ヘッダーのデータテーブルには
 * せず、行の区切りは下罫線のみ・行を枠で囲わない構成にする。
 */
export function FuelLedgerList({ fuelLogs, onSelect, emptyMessage }: Props) {
  if (fuelLogs.length === 0) {
    return <p className={styles.emptyMessage}>{emptyMessage}</p>
  }

  return (
    <div className={styles.table}>
      <div className={styles.headRow} aria-hidden="true">
        <span>日付</span>
        <span>内容</span>
        <span>燃費</span>
      </div>
      <ul className={styles.list}>
        {fuelLogs.map((fuelLog) => (
          <FuelLedgerRow
            key={fuelLog.fuelLogId}
            fuelLog={fuelLog}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  )
}
