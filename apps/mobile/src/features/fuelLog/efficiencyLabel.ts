import {
  resolveSavedFuelLogEfficiencyReason,
  SAVED_FUEL_LOG_EFFICIENCY_REASON_LABELS,
} from '@repo/shared-domain/fuelLogSheet'
import type { ApiResponseFuelLogDetail } from '@repo/shared-types'
import { formatEfficiency } from './fuelLogFormat'

type EfficiencyTarget = Pick<
  ApiResponseFuelLogDetail,
  'fuelLogId' | 'mileage' | 'isFullTank' | 'fuelEfficiency'
>

/**
 * 給油履歴の各行に出す燃費の欄の文言を、記録IDごとに決める
 *
 * @remarks
 * Web の給油履歴（`FuelLogListSection` / `FuelLogItem`）と同じ規則にする。
 * - 燃費が確定していれば燃費（例: 32.1 km/L）
 * - 継ぎ足し給油なら「継ぎ足し」
 * - 満タンでも燃費が無ければ「初回給油」か「前回が継ぎ足し」
 *
 * 後者の判定には走行距離の順で直前の記録が要るが、読み込み済みの記録の中でしか
 * 判定できない（未取得の古い記録は「初回給油」側に倒れる。Web と同じ）。
 */
export function buildEfficiencyLabels(
  fuelLogs: readonly EfficiencyTarget[]
): Map<string, string> {
  const byMileageAsc = [...fuelLogs].sort((a, b) => a.mileage - b.mileage)
  return new Map(
    fuelLogs.map((log) => {
      if (log.fuelEfficiency !== null) {
        return [log.fuelLogId, formatEfficiency(log.fuelEfficiency)]
      }
      if (!log.isFullTank) {
        return [log.fuelLogId, '継ぎ足し']
      }
      const reason = resolveSavedFuelLogEfficiencyReason(
        byMileageAsc,
        log.fuelLogId
      )
      return [log.fuelLogId, SAVED_FUEL_LOG_EFFICIENCY_REASON_LABELS[reason]]
    })
  )
}
