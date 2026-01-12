import type { ApiResponseFuelLogDetail } from '@repo/shared-types'
import type { FuelChartDataPoint, FuelEfficiencyStats } from './fuelChartTypes'

/**
 * 日付フォーマット関数（グラフX軸用）
 * @param dateString - ISO日付文字列
 * @returns MM/DD形式の日付文字列
 */
export function formatChartDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}/${day}`
  } catch {
    return dateString
  }
}

/**
 * 給油ログから燃費グラフ用のデータを生成
 * - fuelEfficiencyがnullのレコードをフィルタ
 * - 直近1年分（365日）のデータのみ抽出
 * - 日付の昇順にソート（グラフ表示用）
 *
 * @param fuelLogs - 給油履歴データ
 * @returns グラフ用のデータポイント配列
 */
export function prepareChartData(
  fuelLogs: ApiResponseFuelLogDetail[]
): FuelChartDataPoint[] {
  // 空配列の場合は早期リターン
  if (fuelLogs.length === 0) {
    return []
  }

  // 現在日時を取得
  const now = new Date()
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

  // フィルタリングと変換
  const chartData = fuelLogs
    // fuelEfficiencyがnullでないもののみ
    .filter((log) => log.fuelEfficiency !== null)
    // 直近1年分のみ
    .filter((log) => {
      const logDate = new Date(log.refueledAt)
      return logDate >= oneYearAgo
    })
    // FuelChartDataPoint型に変換
    .map((log) => ({
      date: formatChartDate(log.refueledAt),
      originalDate: log.refueledAt,
      fuelEfficiency: log.fuelEfficiency as number,
      mileage: log.mileage,
      amount: log.amount,
      totalPrice: log.totalPrice,
    }))
    // 日付の昇順にソート（グラフ表示用）
    .sort((a, b) => {
      return new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime()
    })

  return chartData
}

/**
 * 燃費データの統計情報を計算
 * - 最高燃費/最低燃費の特定
 * - 平均燃費の計算
 *
 * @param dataPoints - グラフ用のデータポイント配列
 * @returns 燃費統計情報
 */
export function calculateFuelStats(
  dataPoints: FuelChartDataPoint[]
): FuelEfficiencyStats | null {
  // データが空の場合はnullを返す
  if (dataPoints.length === 0) {
    return null
  }

  // 初期値設定
  let maxEfficiency = dataPoints[0]!.fuelEfficiency
  let maxEfficiencyDate = dataPoints[0]!.originalDate
  let minEfficiency = dataPoints[0]!.fuelEfficiency
  let minEfficiencyDate = dataPoints[0]!.originalDate
  let totalEfficiency = 0

  // 統計値を計算
  dataPoints.forEach((point) => {
    const efficiency = point.fuelEfficiency

    // 最高燃費の更新
    if (efficiency > maxEfficiency) {
      maxEfficiency = efficiency
      maxEfficiencyDate = point.originalDate
    }

    // 最低燃費の更新
    if (efficiency < minEfficiency) {
      minEfficiency = efficiency
      minEfficiencyDate = point.originalDate
    }

    // 合計燃費の累積
    totalEfficiency += efficiency
  })

  // 平均燃費の計算
  const averageEfficiency = totalEfficiency / dataPoints.length

  return {
    maxEfficiency,
    maxEfficiencyDate,
    minEfficiency,
    minEfficiencyDate,
    averageEfficiency,
    dataPointCount: dataPoints.length,
  }
}
