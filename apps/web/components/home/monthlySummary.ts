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
 * 代わりに「現在の総走行距離」と「月初直前の、最後に記録された給油時の
 * オドメーター値」の2点から走行距離を推定する（詳細は {@link estimateDistanceSinceMonthStart}）。
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

  const distanceKm = estimateDistanceSinceMonthStart(
    beforeMonthFuelLogs,
    currentMileage,
    monthStart,
    now
  )

  return { fuelLogCount, totalFuelCost, distanceKm }
}

/**
 * 月初直前の給油記録と現在の総走行距離の2点から、月初以降の走行距離を推定する
 *
 * @remarks
 * 月初直前の給油は月境界（月初 0:00）とちょうど一致するとは限らない。そのため
 * 「月初直前の給油〜現在」の区間距離をそのまま「今月の走行距離」とすると、
 * 月境界より前（前月分）の走行までも含んでしまう
 * （例: 8/20に給油し9/13時点で見ると、8/20〜31の走行分も9月に混入する）。
 *
 * ここでは月初直前の給油〜現在の走行が一定ペースで発生したとみなし、その期間の
 * うち月初以降が占める時間の割合で区間距離を按分することで、月境界より前の
 * 走行分が混入しないようにする。給油の間隔が月初に近いほど実測値に近づき、
 * 離れているほど「今月分はこの程度」という控えめな推定値になる
 * （一定ペースという前提を置かない限り、月初時点の正確なODOは実測できないため）。
 *
 * 按分の基準となる期間が取れない場合（月初直前の給油記録が無い場合や、
 * 現在の総走行距離が月初直前の給油時より小さい場合）は、近似値をでっち上げず
 * `null` を返す。
 */
function estimateDistanceSinceMonthStart(
  beforeMonthFuelLogs: readonly { occurredAt: Date; mileage: number }[],
  currentMileage: number | null,
  monthStart: Date,
  now: Date
): number | null {
  if (currentMileage === null || beforeMonthFuelLogs.length === 0) {
    return null
  }

  const baseline = beforeMonthFuelLogs.reduce((latest, f) =>
    f.occurredAt > latest.occurredAt ? f : latest
  )

  const totalDiff = currentMileage - baseline.mileage
  if (totalDiff < 0) return null

  const totalMs = now.getTime() - baseline.occurredAt.getTime()
  if (totalMs <= 0) return null

  const inMonthMs = Math.max(0, now.getTime() - monthStart.getTime())
  return Math.round(totalDiff * (inMonthMs / totalMs))
}
