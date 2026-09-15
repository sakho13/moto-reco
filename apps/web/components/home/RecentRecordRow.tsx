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

/**
 * ホーム「最近の記録」の1行
 *
 * @remarks
 * 走行距離・給油量・金額という入力値の再掲ではなく、燃費（給油）・区間距離
 * （ツーリング）という導出値を主役にする（Issue #575「03 再設計の原則」）。
 * 継ぎ足し給油の出し分けは `components/fuel-log/FuelLogItem.tsx` と揃える。
 */
export function RecentRecordRow({ item, onClick }: Props) {
  const kpi =
    item.type === 'FUEL_LOG' ? (
      <FuelKpi fuelEfficiency={item.fuelLog.fuelEfficiency} isFullTank={item.fuelLog.isFullTank} />
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
