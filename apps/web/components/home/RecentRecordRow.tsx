'use client'

import { ChevronRight } from 'lucide-react'
import type { ApiResponseBikeHistoryItem } from '@repo/shared-types'
import { formatDate } from '@repo/shared-utils'
import styles from './RecentRecordRow.module.css'

type Props = {
  item: ApiResponseBikeHistoryItem
  onClick?: () => void
}

const DASH = '—'
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

/**
 * 発生日時から「日付が左に立つ」台帳表記（曜日・月/日）を組み立てる
 *
 * @remarks
 * PC幅の見開き（Issue #575「05 画面案 ─ PC」）で使う。モバイルでは非表示。
 */
function formatLedgerDate(occurredAt: string): {
  weekday: string
  monthDay: string
} {
  const date = new Date(occurredAt)
  return {
    weekday: WEEKDAYS[date.getDay()] ?? '',
    monthDay: `${date.getMonth() + 1}/${date.getDate()}`,
  }
}

/**
 * ホーム「最近の記録」の1行
 *
 * @remarks
 * 走行距離・給油量・金額という入力値の再掲ではなく、燃費（給油）・区間距離
 * （ツーリング）という導出値を主役にする（Issue #575「03 再設計の原則」）。
 * 継ぎ足し給油の出し分けは `components/fuel-log/FuelLogItem.tsx` と揃える。
 *
 * PC幅では「記帳（台帳）」の一部として、日付バッジ（曜日・月/日）と
 * 給油の内訳（区間・給油量・単価）を追加で出す（CSSでのみ出し分け、
 * DOM構造・既存のテキストはモバイルと共通のまま変えない）。
 */
export function RecentRecordRow({ item, onClick }: Props) {
  const { weekday, monthDay } = formatLedgerDate(item.occurredAt)

  const kpi =
    item.type === 'FUEL_LOG' ? (
      <FuelKpi
        fuelEfficiency={item.fuelLog.fuelEfficiency}
        isFullTank={item.fuelLog.isFullTank}
      />
    ) : (
      <TouringKpi
        startMileage={item.touring.startMileage}
        endMileage={item.touring.endMileage}
      />
    )

  const content =
    item.type === 'FUEL_LOG' ? (
      <>
        <p className={styles.title}>
          給油 {item.fuelLog.amount.toFixed(1)}L ¥
          {item.fuelLog.totalPrice.toLocaleString()}
        </p>
        <p className={styles.meta}>
          {formatDate(item.fuelLog.refueledAt)} ・{' '}
          {item.fuelLog.mileage.toLocaleString()}km
        </p>
        <p className={styles.ledgerDetail}>
          区間{' '}
          {(
            item.fuelLog.mileage - item.fuelLog.previousMileage
          ).toLocaleString()}
          km ／ {item.fuelLog.amount.toFixed(1)}L
          {item.fuelLog.pricePerLiter !== null &&
            ` ／ ${Math.round(item.fuelLog.pricePerLiter)}円/L`}
        </p>
      </>
    ) : (
      <>
        <p className={styles.title}>{item.touring.title}</p>
        <p className={styles.meta}>
          {formatDate(item.touring.startDate)} 〜{' '}
          {formatDate(item.touring.endDate)}
        </p>
      </>
    )

  return (
    <button
      type="button"
      className={styles.row}
      onClick={onClick}
      disabled={!onClick}
    >
      <span className={styles.dateBadge} aria-hidden="true">
        <span className={styles.dateWeekday}>{weekday}</span>
        <span className={styles.dateDay}>{monthDay}</span>
      </span>
      <div className={styles.kpi}>{kpi}</div>
      <div className={styles.content}>{content}</div>
      {onClick && (
        <ChevronRight className={styles.chevron} aria-hidden="true" />
      )}
    </button>
  )
}

function FuelKpi({
  fuelEfficiency,
  isFullTank,
}: {
  fuelEfficiency: number | null
  isFullTank: boolean
}) {
  if (fuelEfficiency !== null) {
    return (
      <>
        <span className={styles.kpiValue}>{fuelEfficiency.toFixed(1)}</span>
        <span className={styles.kpiUnit}>km/L</span>
      </>
    )
  }

  if (!isFullTank) {
    return <span className={styles.kpiNote}>継ぎ足し</span>
  }

  return <span className={styles.kpiNote}>初回給油</span>
}

function TouringKpi({
  startMileage,
  endMileage,
}: {
  startMileage: number | null
  endMileage: number | null
}) {
  const distance =
    startMileage !== null && endMileage !== null
      ? endMileage - startMileage
      : null

  return (
    <>
      <span className={styles.kpiValue}>
        {distance === null ? DASH : distance.toLocaleString()}
      </span>
      <span className={styles.kpiUnit}>km</span>
    </>
  )
}
