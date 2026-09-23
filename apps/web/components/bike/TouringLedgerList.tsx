'use client'

import type { ApiResponseTouringDetail } from '@repo/shared-types'
import styles from './TouringLedgerList.module.css'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function formatWeekday(dateString: string): string {
  return WEEKDAYS[new Date(dateString).getDay()] ?? ''
}

function formatMonthDay(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`
}

type TouringLedgerRowProps = {
  touring: ApiResponseTouringDetail
  onSelect: (touringId: string) => void
}

function TouringLedgerRow({ touring, onSelect }: TouringLedgerRowProps) {
  const distance =
    touring.startMileage !== null && touring.endMileage !== null
      ? touring.endMileage - touring.startMileage
      : null

  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.row}
        onClick={() => onSelect(touring.touringId)}
      >
        <span className={styles.date}>
          <span className={styles.dateWeekday}>
            {formatWeekday(touring.startDate)}
          </span>
          <span className={styles.dateDay}>
            {formatMonthDay(touring.startDate)}
          </span>
        </span>

        <span className={styles.body}>
          <span className={styles.typeLine}>
            <span
              className={
                touring.status === 'STARTED'
                  ? styles.tagStarted
                  : styles.tagCompleted
              }
            >
              {touring.status === 'STARTED' ? '進行中' : '完了'}
            </span>
            <span className={styles.title}>{touring.title}</span>
          </span>
          <span className={styles.detailLine}>
            {formatTime(touring.startDate)} → {formatTime(touring.endDate)}
            {touring.startMileage !== null && (
              <>
                {' '}
                ／ {touring.startMileage.toLocaleString()}km →{' '}
                {touring.endMileage !== null
                  ? `${touring.endMileage.toLocaleString()}km`
                  : '走行中'}
              </>
            )}
          </span>
        </span>

        <span className={styles.value}>
          {distance !== null ? (
            <>
              <span className={styles.valueNumber}>
                {distance.toLocaleString()}
              </span>
              <span className={styles.valueUnit}>km</span>
            </>
          ) : (
            <span className={styles.valueNoteMuted}>走行距離未記録</span>
          )}
        </span>
      </button>
    </li>
  )
}

type Props = {
  tourings: ApiResponseTouringDetail[]
  onSelect: (touringId: string) => void
  emptyMessage: string
}

/**
 * ツーリングの台帳（行リスト）の表示部品（Issue #575「05 画面案 ─ PC」）
 *
 * @remarks
 * `/app/my-bike/{id}/tourings` のPC版一覧（`TouringLedgerSection`）から使う。
 * `FuelLedgerList` と同じ罫線区切り・枠なしの行構成にする。
 */
export function TouringLedgerList({ tourings, onSelect, emptyMessage }: Props) {
  if (tourings.length === 0) {
    return <p className={styles.emptyMessage}>{emptyMessage}</p>
  }

  return (
    <div className={styles.table}>
      <div className={styles.countRow} aria-hidden="true">
        <span>{tourings.length}件</span>
      </div>
      <ul className={styles.list}>
        {tourings.map((touring) => (
          <TouringLedgerRow
            key={touring.touringId}
            touring={touring}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  )
}
