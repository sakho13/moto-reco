/**
 * 燃費計算の対象となる給油履歴の最小情報
 */
export type FuelEfficiencyCalculationTarget = {
  fuelLogId: string
  mileage: number
  amount: number
  isFullTank: boolean
}

/**
 * 満タン法による燃費計算を担うサービス
 *
 * @remarks
 * 継ぎ足し給油（isFullTank: false）は燃費計算の対象外とし、
 * その区間距離・給油量は次の満タン給油の燃費計算に繰り込む。
 *
 * - 継ぎ足し給油: 常に `null`
 * - 満タン給油: 直前の満タン給油からの区間距離 ÷
 *   （直前の満タン給油より後に記録された全給油量の合計）
 * - 直前の満タン給油が存在しない場合（初回給油など）は `null`
 *
 * 給油履歴を全て満タン給油として移行した場合、継ぎ足しが存在しなければ
 * 「直前の満タン給油」は「直前の給油」と一致するため、従来の
 * `(mileage - previousMileage) / amount` による算出結果と一致する。
 */
export class FuelEfficiencyCalculationService {
  /**
   * 給油履歴（mileage昇順）から、各給油ログの燃費（km/L）を算出する
   *
   * @param logsOrderedByMileageAsc 同一バイクの給油履歴。mileage昇順に並んでいること
   * @returns fuelLogIdをキーとした燃費（km/L, 小数点以下1桁で四捨五入）のMap。計算不可の場合はnull
   */
  public calculate(
    logsOrderedByMileageAsc: readonly FuelEfficiencyCalculationTarget[]
  ): Map<string, number | null> {
    const result = new Map<string, number | null>()

    let lastFullTankMileage: number | null = null
    let amountSinceLastFullTank = 0

    for (const log of logsOrderedByMileageAsc) {
      amountSinceLastFullTank += log.amount

      if (!log.isFullTank) {
        // 継ぎ足し給油は燃費計算の対象外。給油量のみ次の満タン給油に繰り越す
        result.set(log.fuelLogId, null)
        continue
      }

      const distance =
        lastFullTankMileage === null
          ? null
          : log.mileage - lastFullTankMileage

      result.set(
        log.fuelLogId,
        distance !== null && distance > 0
          ? Math.round((distance / amountSinceLastFullTank) * 10) / 10
          : null
      )

      lastFullTankMileage = log.mileage
      amountSinceLastFullTank = 0
    }

    return result
  }
}
