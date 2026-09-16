import type { ApiResponseBikeHistoryItem } from '@repo/shared-types'

/**
 * 当月サマリ（Issue #575「05 画面案 ─ PC」見出し罫・添え数値）
 */
export type MonthlySummary = {
  /** 当月の給油回数 */
  fuelLogCount: number
  /** 当月の燃料費合計（円）。記録が無ければ 0 */
  totalFuelCost: number
  /** 当月の走行距離（km）。算出できない場合は null */
  distanceKm: number | null
}

/**
 * 当月（`now` を含む暦月）のサマリを、既存のヒストリー全件と現在の総走行距離から算出する
 *
 * @remarks
 * Issue #575「05 画面案 ─ PC」の新しい集計APIは用意しない方針のため、
 * `useBikeHistory`（`/bike/{id}/history`、ページングなしの全件）をクライアント側で
 * 月初でフィルタして求める。
 *
 * 給油回数・燃料費は当月の `FUEL_LOG` を素直に数え上げれば求まるが、
 * 走行距離だけは単純合計ができない。給油の区間距離とツーリングの区間距離は
 * 同じ走行の一部を二重に含み得るため、合算すると水増しになる。
 * 代わりに「現在の総走行距離」から「当月に入る直前の、最後に記録された給油時の
 * オドメーター値」を引いた差分を使う。これは記録の種類を問わず実際に進んだ
 * 距離そのものになる。
 *
 * 当月より前の給油記録が1件も無い場合は基準点が無く算出できないため、
 * 近似値をでっち上げず `null` を返す（呼び出し側は「—」を表示する）。
 */
export function buildMonthlySummary(
  history: readonly ApiResponseBikeHistoryItem[],
  currentMileage: number | null,
  now: Date
): MonthlySummary {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const fuelLogs = history.flatMap((item) =>
    item.type === 'FUEL_LOG'
      ? [
          {
            occurredAt: new Date(item.occurredAt),
            mileage: item.fuelLog.mileage,
            totalPrice: item.fuelLog.totalPrice,
          },
        ]
      : []
  )

  const thisMonthFuelLogs = fuelLogs.filter((f) => f.occurredAt >= monthStart)
  const fuelLogCount = thisMonthFuelLogs.length
  const totalFuelCost = thisMonthFuelLogs.reduce(
    (sum, f) => sum + f.totalPrice,
    0
  )

  const beforeMonthFuelLogs = fuelLogs.filter((f) => f.occurredAt < monthStart)

  let distanceKm: number | null = null
  if (currentMileage !== null && beforeMonthFuelLogs.length > 0) {
    const baseline = beforeMonthFuelLogs.reduce((latest, f) =>
      f.occurredAt > latest.occurredAt ? f : latest
    )
    const diff = currentMileage - baseline.mileage
    distanceKm = diff >= 0 ? diff : null
  }

  return { fuelLogCount, totalFuelCost, distanceKm }
}
