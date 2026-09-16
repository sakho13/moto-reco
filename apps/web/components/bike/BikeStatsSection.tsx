'use client'

import type { ApiResponseFuelLogDetail } from '@repo/shared-types'
import styles from './BikeStatsSection.module.css'

const DASH = '—'

type Props = {
  /** 期間・満タンフィルタ適用後の給油履歴（順不同で可） */
  fuelLogs: ApiResponseFuelLogDetail[]
  isLoading: boolean
}

/**
 * 愛車のカルテ（PC）の添え数値（Issue #575「05 画面案 ─ PC」愛車）
 *
 * @remarks
 * 平均燃費／最良・最低／給油総量／燃料費（1kmあたり）の4項目。
 * `BikeGauges`（モバイルの計器：平均燃費・前回給油から・今月の燃料費）とは
 * 別コンポーネントとして新設した。同じ「平均燃費」ラベルを両方が持つため、
 * 混在させず `BikeGauges` はモバイルのみ・本コンポーネントはPCのみで
 * 排他的に表示する（`page.module.css` の `.mobileOnly` / `.desktopOnly`）。
 * 新しいAPIは追加せず、既存の給油履歴一覧APIから取得した期間内のデータを
 * クライアント側で集計する。
 */
export function BikeStatsSection({ fuelLogs, isLoading }: Props) {
  const validLogs = fuelLogs.filter(
    (log): log is ApiResponseFuelLogDetail & { fuelEfficiency: number } =>
      log.fuelEfficiency !== null
  )

  const averageEfficiency =
    validLogs.length > 0
      ? validLogs.reduce((sum, log) => sum + log.fuelEfficiency, 0) /
        validLogs.length
      : null

  const bestEfficiency =
    validLogs.length > 0
      ? Math.max(...validLogs.map((log) => log.fuelEfficiency))
      : null

  const worstEfficiency =
    validLogs.length > 0
      ? Math.min(...validLogs.map((log) => log.fuelEfficiency))
      : null

  const totalAmount = fuelLogs.reduce((sum, log) => sum + log.amount, 0)
  const totalCost = fuelLogs.reduce((sum, log) => sum + log.totalPrice, 0)
  const totalDistance = fuelLogs.reduce(
    (sum, log) => sum + Math.max(log.mileage - log.previousMileage, 0),
    0
  )
  const costPerKm = totalDistance > 0 ? totalCost / totalDistance : null

  const showDash = isLoading || fuelLogs.length === 0

  return (
    <div className={styles.section} data-testid="bike-stats-section">
      <div className={styles.fig}>
        <span className={styles.label}>平均燃費</span>
        <span className={styles.valueLead}>
          {showDash || averageEfficiency === null
            ? DASH
            : averageEfficiency.toFixed(1)}
          <span className={styles.unit}>km/L</span>
        </span>
        <span className={styles.note}>{validLogs.length}回の給油から算出</span>
      </div>

      <div className={styles.fig}>
        <span className={styles.label}>最良 ／ 最低</span>
        <span className={styles.value}>
          {showDash || bestEfficiency === null || worstEfficiency === null
            ? DASH
            : `${bestEfficiency.toFixed(1)} / ${worstEfficiency.toFixed(1)}`}
          <span className={styles.unit}>km/L</span>
        </span>
      </div>

      <div className={styles.fig}>
        <span className={styles.label}>給油総量</span>
        <span className={styles.value}>
          {showDash ? DASH : totalAmount.toFixed(1)}
          <span className={styles.unit}>L</span>
        </span>
        <span className={styles.note}>{fuelLogs.length}回</span>
      </div>

      <div className={styles.fig}>
        <span className={styles.label}>燃料費</span>
        <span className={styles.value}>
          {showDash ? DASH : `¥${totalCost.toLocaleString()}`}
        </span>
        <span className={styles.note}>
          1kmあたり{' '}
          {showDash || costPerKm === null ? DASH : costPerKm.toFixed(1)}円
        </span>
      </div>
    </div>
  )
}
