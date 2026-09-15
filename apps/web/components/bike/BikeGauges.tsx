'use client'

import styles from './BikeGauges.module.css'
import { useBikeHistory } from '@/lib/hooks/useBikeHistory'
import { useFuelInsight } from '@/lib/hooks/useFuelInsight'

const DASH = '—'

type Props = {
  bikeId: string
  totalMileage: number
}

function isSameMonth(isoDate: string, now: Date): boolean {
  const d = new Date(isoDate)
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  )
}

/**
 * 愛車の計器（平均燃費・前回給油からの距離・今月の燃料費）
 *
 * @remarks
 * 入力値ではなく導出値を主役に置くという設計原則（Issue #575）に基づく。
 * データ源はいずれも既存API（燃費インサイト・バイク単位のヒストリー）で、
 * 新しいAPIは追加しない。値が求まらない場合は「—」にし、エラー表示や
 * 空カードにはしない。
 */
export function BikeGauges({ bikeId, totalMileage }: Props) {
  const { data: history } = useBikeHistory(bikeId)
  const { data: insight } = useFuelInsight(bikeId)

  const fuelLogs = (history ?? []).flatMap((item) =>
    item.type === 'FUEL_LOG' ? [item.fuelLog] : []
  )

  const averageEfficiency = insight?.averageFuelEfficiency ?? null

  const lastFuelLog = fuelLogs[0] ?? null
  const distanceSinceLastFuelLog =
    lastFuelLog === null ? null : Math.max(totalMileage - lastFuelLog.mileage, 0)

  const now = new Date()
  const thisMonthFuelCost =
    history === undefined
      ? null
      : fuelLogs
          .filter((log) => isSameMonth(log.refueledAt, now))
          .reduce((sum, log) => sum + log.totalPrice, 0)

  return (
    <div className={styles.gauges} data-testid="bike-gauges">
      <div className={styles.gauge}>
        <p className={styles.value}>
          {averageEfficiency === null ? DASH : averageEfficiency.toFixed(1)}
          <span className={styles.unit}>km/L</span>
        </p>
        <p className={styles.label}>平均燃費</p>
      </div>

      <div className={styles.gauge}>
        <p className={styles.value}>
          {distanceSinceLastFuelLog === null
            ? DASH
            : distanceSinceLastFuelLog.toLocaleString()}
          <span className={styles.unit}>km</span>
        </p>
        <p className={styles.label}>前回給油から</p>
      </div>

      <div className={styles.gauge}>
        <p className={styles.value}>
          {thisMonthFuelCost === null ? DASH : thisMonthFuelCost.toLocaleString()}
          <span className={styles.unit}>円</span>
        </p>
        <p className={styles.label}>今月の燃料費</p>
      </div>
    </div>
  )
}
