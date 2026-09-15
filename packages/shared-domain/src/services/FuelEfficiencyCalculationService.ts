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
 * 満タン法で算出した1区間の詳細
 *
 * @remarks
 * `distance / amount` が燃費（km/L）になる。平均燃費など、燃費を算出できる
 * 区間だけを母数にした集計を行う際に、距離・給油量を個別に必要とするため
 * {@link FuelEfficiencyCalculationService.calculateDetails} が返す。
 */
export type FuelEfficiencyInterval = {
  /** 直前の満タン給油からの区間距離（km） */
  distance: number
  /** 区間距離に対応する給油量（継ぎ足し給油分を含む合計, L） */
  amount: number
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
   * @remarks
   * 丸め処理は行わず生の値を返す。表示桁数の丸めは表示側（UI）の責務とする
   * （グラフの精度低下や集計への丸め誤差混入を避けるため）。
   *
   * @param logsOrderedByMileageAsc 同一バイクの給油履歴。mileage昇順に並んでいること
   * @returns fuelLogIdをキーとした燃費（km/L, 丸めなしの生の値）のMap。計算不可の場合はnull
   */
  public calculate(
    logsOrderedByMileageAsc: readonly FuelEfficiencyCalculationTarget[]
  ): Map<string, number | null> {
    const details = this.calculateDetails(logsOrderedByMileageAsc)
    const result = new Map<string, number | null>()

    for (const [fuelLogId, interval] of details) {
      result.set(
        fuelLogId,
        interval !== null ? interval.distance / interval.amount : null
      )
    }

    return result
  }

  /**
   * 給油履歴（mileage昇順）から、各給油ログの区間詳細（区間距離・区間給油量）を算出する
   *
   * @remarks
   * {@link calculate} は燃費（km/L）の比率のみを返すが、平均燃費などの集計
   * （FuelInsight）では「燃費を算出できる区間」の距離・給油量をそれぞれ合計する
   * 必要があるため、内訳を個別に取得できるメソッドとして分離している。
   *
   * @param logsOrderedByMileageAsc 同一バイクの給油履歴。mileage昇順に並んでいること
   * @returns fuelLogIdをキーとした区間詳細のMap。計算不可の場合はnull
   */
  public calculateDetails(
    logsOrderedByMileageAsc: readonly FuelEfficiencyCalculationTarget[]
  ): Map<string, FuelEfficiencyInterval | null> {
    const result = new Map<string, FuelEfficiencyInterval | null>()

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
        lastFullTankMileage === null ? null : log.mileage - lastFullTankMileage

      result.set(
        log.fuelLogId,
        distance !== null && distance > 0
          ? { distance, amount: amountSinceLastFullTank }
          : null
      )

      lastFullTankMileage = log.mileage
      amountSinceLastFullTank = 0
    }

    return result
  }

  /**
   * 給油履歴（mileage昇順）から、期間全体の平均燃費（km/L）を算出する
   *
   * @remarks
   * 燃費を算出できる区間（直前に満タン給油が存在し、区間距離が正の満タン給油）
   * のみを母数とし、区間距離の合計 ÷ 区間給油量の合計（距離加重平均）で算出する。
   * 初回給油（直前の満タン給油が無い）や継ぎ足し給油単独は距離・給油量とも
   * 母数から除外されるが、継ぎ足し給油の給油量は次の満タン給油の区間に
   * 繰り込まれるため捨てられることはない。
   * 燃費を算出できる区間が1件も無い場合は `0` ではなく `null` を返す。
   *
   * @param logsOrderedByMileageAsc 同一バイクの給油履歴。mileage昇順に並んでいること
   * @returns 平均燃費（km/L, 丸めなしの生の値）。算出不可の場合はnull
   */
  public calculateAverageEfficiency(
    logsOrderedByMileageAsc: readonly FuelEfficiencyCalculationTarget[]
  ): number | null {
    const details = this.calculateDetails(logsOrderedByMileageAsc)

    let totalDistance = 0
    let totalAmount = 0

    for (const interval of details.values()) {
      if (interval === null) {
        continue
      }
      totalDistance += interval.distance
      totalAmount += interval.amount
    }

    return totalAmount > 0 ? totalDistance / totalAmount : null
  }
}
