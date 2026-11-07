'use client'

import type { ReactNode } from 'react'
import type { ApiResponseTouringListItem } from '@repo/shared-types'
import styles from './TouringLedgerList.module.css'
import {
  formatTouringSummary,
  sumTouringDistance,
  TouringMonthHeading,
} from '@/components/touring/TouringMonthHeading'
import { TouringPebbles } from '@/components/touring/TouringPebbles'
import { TouringRouteStone } from '@/components/touring/TouringRouteStone'
import { TouringStatusMark } from '@/components/touring/TouringStatusMark'
import {
  getTouringDistance,
  groupTouringsByMonth,
} from '@/lib/utils/touringJourney'

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
  touring: ApiResponseTouringListItem
  onSelect: (touringId: string) => void
}

function formatEndTime(touring: ApiResponseTouringListItem): string {
  if (touring.status === 'STARTED') return '走行中'
  const isSameDay =
    new Date(touring.startDate).toDateString() ===
    new Date(touring.endDate).toDateString()
  return isSameDay
    ? formatTime(touring.endDate)
    : `${formatMonthDay(touring.endDate)} ${formatTime(touring.endDate)}`
}

function TouringLedgerRow({ touring, onSelect }: TouringLedgerRowProps) {
  const distance = getTouringDistance(touring)
  const isStarted = touring.status === 'STARTED'

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

        <span className={styles.stoneSlot}>
          <TouringRouteStone touring={touring} />
        </span>

        <span className={styles.body}>
          <span className={styles.titleLine}>
            <span className={styles.title}>{touring.title}</span>
            <TouringStatusMark status={touring.status} size="sm" />
          </span>
          <span className={styles.detailLine}>
            {formatTime(touring.startDate)} → {formatEndTime(touring)}
            {touring.startMileage !== null && (
              <>
                {' '}
                ／ {touring.startMileage.toLocaleString()}km
                {touring.endMileage !== null &&
                  ` → ${touring.endMileage.toLocaleString()}km`}
              </>
            )}
          </span>
          <TouringPebbles stops={touring.stops} status={touring.status} />
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
            <span className={styles.valueNoteMuted}>
              {isStarted ? '走行中' : '走行距離未記録'}
            </span>
          )}
        </span>
      </button>
    </li>
  )
}

type Props = {
  tourings: ApiResponseTouringListItem[]
  /** 月ごとの見出しを出すか。日付順に並んでいるときだけ指定する */
  groupByMonth: boolean
  onSelect: (touringId: string) => void
  /** 0件のときに出す内容 */
  emptyContent: ReactNode
}

/**
 * ツーリングの台帳（行リスト）の表示部品
 *
 * @remarks
 * `/app/my-bike/{id}/tourings` のPC版一覧（`TouringLedgerSection`）から使う。
 * `FuelLedgerList` と同じ罫線区切り・枠なしの行構成に、経路の形を入れた石の列を足す。
 */
export function TouringLedgerList({
  tourings,
  groupByMonth,
  onSelect,
  emptyContent,
}: Props) {
  if (tourings.length === 0) {
    return <div className={styles.empty}>{emptyContent}</div>
  }

  const renderRows = (items: ApiResponseTouringListItem[]) => (
    <ul className={styles.list}>
      {items.map((touring) => (
        <TouringLedgerRow
          key={touring.touringId}
          touring={touring}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )

  return (
    <div className={styles.table}>
      <div
        className={`${styles.countRow} ${groupByMonth ? '' : styles.countRowRuled}`}
        aria-hidden="true"
      >
        <span>
          {formatTouringSummary(
            tourings.length,
            '件',
            sumTouringDistance(tourings)
          )}
        </span>
      </div>
      {groupByMonth ? (
        <div className={styles.groups}>
          {groupTouringsByMonth(tourings).map((group) => (
            <div key={group.key}>
              <TouringMonthHeading
                label={group.label}
                count={group.items.length}
                totalDistance={group.totalDistance}
              />
              {renderRows(group.items)}
            </div>
          ))}
        </div>
      ) : (
        renderRows(tourings)
      )}
    </div>
  )
}
