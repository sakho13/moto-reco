/**
 * グラフ用のデータポイント型
 */
export type FuelChartDataPoint = {
  /** 表示用の日付（MM/DD形式） */
  date: string
  /** 元のISO日付文字列（ソート・フィルタ用） */
  originalDate: string
  /** 燃費 (km/L) */
  fuelEfficiency: number
  /** 総走行距離 (km) - ツールチップ用 */
  mileage: number
  /** 給油量 (L) - ツールチップ用 */
  amount: number
  /** 給油価格 (円) - ツールチップ用 */
  totalPrice: number
}

/**
 * 燃費統計情報
 */
export type FuelEfficiencyStats = {
  /** 最高燃費 */
  maxEfficiency: number
  /** 最高燃費の日付 */
  maxEfficiencyDate: string
  /** 最低燃費 */
  minEfficiency: number
  /** 最低燃費の日付 */
  minEfficiencyDate: string
  /** 平均燃費 */
  averageEfficiency: number
  /** データポイント数 */
  dataPointCount: number
}
