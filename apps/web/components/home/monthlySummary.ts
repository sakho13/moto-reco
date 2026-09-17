import type { ApiResponseBikeHistoryItem } from '@repo/shared-types'

/**
 * 当月サマリ（Issue #575「05 画面案 ─ PC」見出し罫・添え数値）
 *
 * @remarks
 * 当月の走行距離は推定値（月初直前の給油〜現在を一定ペースとみなした按分）を
 * 実測のように見せてしまうため表示しない（Issue #575 ユーザー判断）。
 * ここでは実測値だけで組み立てられる給油回数・給油量・燃料費のみを扱う。
 */
export type MonthlySummary = {
  /** 当月の給油回数 */
  fuelLogCount: number
  /** 当月の給油量合計（L）。記録が無ければ 0 */
  totalFuelAmount: number
  /** 当月の燃料費合計（円）。記録が無ければ 0 */
  totalFuelCost: number
}

/**
 * 当月（`now` を含む暦月）のサマリを、既存のヒストリー全件から算出する
 *
 * @remarks
 * Issue #575「05 画面案 ─ PC」の新しい集計APIは用意しない方針のため、
 * `useBikeHistory`（`/bike/{id}/history`、ページングなしの全件）をクライアント側で
 * 月初でフィルタして求める。給油回数・給油量・燃料費はいずれも当月の
 * `FUEL_LOG` を素直に数え上げ・合算すれば求まる実測値。
 */
export function buildMonthlySummary(
  history: readonly ApiResponseBikeHistoryItem[],
  now: Date
): MonthlySummary {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const fuelLogs = history.flatMap((item) =>
    item.type === 'FUEL_LOG'
      ? [
          {
            occurredAt: new Date(item.occurredAt),
            amount: item.fuelLog.amount,
            totalPrice: item.fuelLog.totalPrice,
          },
        ]
      : []
  )

  const thisMonthFuelLogs = fuelLogs.filter((f) => f.occurredAt >= monthStart)
  const fuelLogCount = thisMonthFuelLogs.length
  const totalFuelAmount = thisMonthFuelLogs.reduce(
    (sum, f) => sum + f.amount,
    0
  )
  const totalFuelCost = thisMonthFuelLogs.reduce(
    (sum, f) => sum + f.totalPrice,
    0
  )

  return { fuelLogCount, totalFuelAmount, totalFuelCost }
}
