'use client'

import { getCurrentDate } from '@repo/shared-utils'
import styles from './HomeGauges.module.css'
import { buildMonthlySummary } from './monthlySummary'
import { roundToOneDecimal } from '@/lib/fuelLogSheet'
import { useActiveBike } from '@/lib/hooks/useActiveBike'
import { useBikeHistory } from '@/lib/hooks/useBikeHistory'
import { useFuelInsight } from '@/lib/hooks/useFuelInsight'

const DASH = '—'

function formatEfficiency(value: number | null): string {
  return value === null ? DASH : value.toFixed(1)
}

/**
 * 直近の燃費と、その一つ前の燃費との差分を言葉にする
 *
 * @remarks
 * 「▲1.8」のような前期比表記ではなく「前回より 1.8 伸びた」のように文章で表す
 * （Issue #575「03 再設計の原則」）。比較対象が無ければ何も返さない。
 *
 * 差分は丸め前の生値ではなく、画面に表示する値（小数点1桁に丸めた値）どうしで
 * 取る。例えば直近22.0339…（表示22.0）と前回20.1613…（表示20.2）の場合、
 * 生値の差は1.8726（丸めると1.9）だが、ユーザーには22.0と20.2しか見えないため
 * 差は1.8でなければ表示と文章が噛み合わない（`lib/fuelLogSheet.ts` の
 * `formatComparisonClause` も同様の理由で丸めた値の差を取る）。
 * マイナス方向の動詞は「縮んだ」で揃える（`lib/fuelLogSheet.ts` と表記統一）。
 */
function buildEfficiencyDiffText(
  latest: number | null,
  previous: number | null
): string | null {
  if (latest === null || previous === null) return null

  const diff = roundToOneDecimal(
    roundToOneDecimal(latest) - roundToOneDecimal(previous)
  )
  if (diff > 0) return `前回より ${diff.toFixed(1)} 伸びた`
  if (diff < 0) return `前回より ${Math.abs(diff).toFixed(1)} 縮んだ`
  return '前回と同じ'
}

/**
 * ホーム最上部の計器（直近燃費・平均燃費・前回単価）
 *
 * @remarks
 * 入力値ではなく導出値を主役に置くという設計原則（Issue #575）に基づき、
 * 給油の生データではなく燃費・単価だけを表示する。
 * データ源はいずれも既存API（アクティブ車両のヒストリー・燃費インサイト）で、
 * 値が求まらない場合はエラー表示や空カードにせず「—」にする。
 */
export function HomeGauges() {
  const { activeBike } = useActiveBike()
  const bikeId = activeBike?.myUserBikeId ?? null

  const { data: history } = useBikeHistory(bikeId)
  const { data: insight } = useFuelInsight(bikeId)

  const fuelLogs = (history ?? []).flatMap((item) =>
    item.type === 'FUEL_LOG' ? [item.fuelLog] : []
  )

  const recentEfficiencies = fuelLogs
    .map((log) => log.fuelEfficiency)
    .filter((value): value is number => value !== null)

  const latestEfficiency = recentEfficiencies[0] ?? null
  const previousEfficiency = recentEfficiencies[1] ?? null
  const diffText = buildEfficiencyDiffText(latestEfficiency, previousEfficiency)

  const lastPricePerLiter = fuelLogs[0]?.pricePerLiter ?? null
  const averageEfficiency = insight?.averageFuelEfficiency ?? null

  // 「今月の燃料費」はPC幅（見開きの添え数値）でのみ表示する4つ目の計器。
  // 新しい集計APIは作らず、既存のヒストリー全件をクライアント側で当月分に絞って合算する。
  const monthlySummary = buildMonthlySummary(history ?? [], getCurrentDate())

  return (
    <div className={styles.gauges} data-testid="home-gauges">
      <div className={styles.gauge}>
        <p className={styles.value}>
          {formatEfficiency(latestEfficiency)}
          <span className={styles.unit}>km/L</span>
        </p>
        <p className={styles.label}>直近の燃費</p>
        {diffText && <p className={styles.diff}>{diffText}</p>}
      </div>

      <div className={styles.gauge}>
        <p className={styles.value}>
          {formatEfficiency(averageEfficiency)}
          <span className={styles.unit}>km/L</span>
        </p>
        <p className={styles.label}>平均燃費</p>
      </div>

      <div className={styles.gauge}>
        <p className={styles.value}>
          {lastPricePerLiter === null ? DASH : Math.round(lastPricePerLiter)}
          <span className={styles.unit}>円/L</span>
        </p>
        <p className={styles.label}>前回の単価</p>
      </div>

      {/* PC幅（見開き）専用の4つ目の計器。モバイルは計器3つのまま変えない */}
      <div className={`${styles.gauge} ${styles.monthlyGauge}`}>
        <p className={styles.value}>
          {monthlySummary.totalFuelCost.toLocaleString()}
          <span className={styles.unit}>円</span>
        </p>
        <p className={styles.label}>今月の燃料費</p>
      </div>
    </div>
  )
}
