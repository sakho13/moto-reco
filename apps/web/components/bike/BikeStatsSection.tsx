'use client'

import type { ApiResponseFuelLogDetail } from '@repo/shared-types'
import styles from './BikeStatsSection.module.css'
import { calculateBridgedAverageEfficiency } from '@/lib/fuelLogSheet'

const DASH = '—'

type Props = {
  /** 期間・満タンフィルタ適用後の給油履歴（順不同で可） */
  fuelLogs: ApiResponseFuelLogDetail[]
  /**
   * 平均燃費の満タン法区間判定にのみ使う、期間フィルタ・満タンフィルタの
   * いずれも適用前の給油履歴全件（順不同で可）
   *
   * @remarks
   * `fuelLogs`（期間フィルタ済み）だけを満タン法に渡すと、期間の先頭にある
   * 給油が実際には期間より前の満タン給油から続く区間だった場合に、直前の
   * 満タン給油を参照できず区間が誤って除外されてしまう（Issue #575
   * Codexの指摘#5）。`calculateBridgedAverageEfficiency`
   * （`PrismaFuelInsightRepository.findBridgeRows` と同じ考え方）に渡し、
   * 区間判定にのみ使う。母数（分母・分子）は `fuelLogs` に含まれる
   * 給油ログのみに限定されるため、期間内の集計は変わらない。
   * 継ぎ足し給油を含む全件を渡す必要がある（除外すると、区間をまたぐ
   * 継ぎ足しの給油量が次の満タン給油の区間から失われてしまうため）。
   */
  allFuelLogs: ApiResponseFuelLogDetail[]
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
export function BikeStatsSection({ fuelLogs, allFuelLogs, isLoading }: Props) {
  const validLogs = fuelLogs.filter(
    (log): log is ApiResponseFuelLogDetail & { fuelEfficiency: number } =>
      log.fuelEfficiency !== null
  )

  // 平均燃費は区間ごとの燃費値の単純平均ではなく、距離加重平均
  // （総距離 ÷ 総給油量）で算出する。区間判定（直前の満タン給油の参照）は
  // 期間フィルタ前の全件（`allFuelLogs`）で行い、期間の先頭で区間が境界を
  // またぐ場合の精度低下を防ぐ。集計対象は `fuelLogs`（期間フィルタ済み）
  // に含まれる給油ログのみに限定する。
  const inPeriodFuelLogIds = new Set(fuelLogs.map((log) => log.fuelLogId))
  const averageEfficiency = calculateBridgedAverageEfficiency(
    allFuelLogs,
    inPeriodFuelLogIds
  )

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
          {showDash ? DASH : totalCost.toLocaleString()}
          <span className={styles.unit}>円</span>
        </span>
        <span className={styles.note}>
          1kmあたり{' '}
          {showDash || costPerKm === null ? DASH : costPerKm.toFixed(1)}円
        </span>
      </div>
    </div>
  )
}
