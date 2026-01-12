'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts'
import type { ApiResponseFuelLogDetail } from '@repo/shared-types'
import styles from './FuelEfficiencyChart.module.css'
import type { FuelChartDataPoint } from './types'
import { prepareChartData, calculateFuelStats } from '@/lib/utils/fuelChartUtils'

export interface FuelEfficiencyChartProps {
  /** 給油履歴データ（生データ） */
  fuelLogs: ApiResponseFuelLogDetail[]
}

/**
 * カスタムツールチップのprops型定義
 */
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: FuelChartDataPoint
  }>
}

/**
 * カスタムツールチップコンポーネント
 */
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length || !payload[0]) {
    return null
  }

  const data = payload[0].payload

  // 日付フォーマット（YYYY/MM/DD形式）
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDate}>{formatDate(data.originalDate)}</p>
      <p className={styles.tooltipEfficiency}>
        燃費: {data.fuelEfficiency.toFixed(1)} km/L
      </p>
      <p className={styles.tooltipDetail}>
        走行距離: {data.mileage.toLocaleString()} km
      </p>
      <p className={styles.tooltipDetail}>
        給油量: {data.amount.toFixed(1)} L
      </p>
    </div>
  )
}

/**
 * 燃費グラフコンポーネント
 * Recharts LineChartで燃費推移を可視化
 */
export const FuelEfficiencyChart = ({ fuelLogs }: FuelEfficiencyChartProps) => {
  // データ変換（メモ化）
  const chartData = useMemo(() => prepareChartData(fuelLogs), [fuelLogs])

  // 統計計算（メモ化）
  const stats = useMemo(() => calculateFuelStats(chartData), [chartData])

  // 空状態の場合
  if (chartData.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.emptyState}>
          <p>燃費データがありません</p>
          <p className={styles.emptySubtext}>
            2回以上の給油履歴が必要です
          </p>
        </div>
      </div>
    )
  }

  // 統計情報が取得できない場合（念のため）
  if (!stats) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.emptyState}>
          <p>統計情報を計算できませんでした</p>
        </div>
      </div>
    )
  }

  // 最高燃費と最低燃費のデータポイントを特定
  const maxPoint = chartData.find(
    (point) => point.originalDate === stats.maxEfficiencyDate
  )
  const minPoint = chartData.find(
    (point) => point.originalDate === stats.minEfficiencyDate
  )

  return (
    <div className={styles.chartContainer}>
      <h2 className={styles.chartTitle}>燃費推移グラフ</h2>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            {/* X軸: 日付 */}
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: 'var(--color-ink)', opacity: 0.7 }}
              stroke="var(--color-ink)"
              strokeOpacity={0.3}
            />

            {/* Y軸: 燃費 (km/L) */}
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 12, fill: 'var(--color-ink)', opacity: 0.7 }}
              stroke="var(--color-ink)"
              strokeOpacity={0.3}
              label={{
                value: 'km/L',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: 'var(--color-ink)', opacity: 0.7 },
              }}
            />

            {/* グリッド線 */}
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-cloud)" opacity={0.5} />

            {/* ツールチップ */}
            <Tooltip content={<CustomTooltip />} />

            {/* 平均値ライン */}
            <ReferenceLine
              y={stats.averageEfficiency}
              stroke="var(--color-success)"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `平均: ${stats.averageEfficiency.toFixed(1)} km/L`,
                position: 'right',
                fill: 'var(--color-success)',
                fontSize: 12,
                fontWeight: 600,
              }}
            />

            {/* 最高燃費マーカー */}
            {maxPoint && (
              <ReferenceDot
                x={maxPoint.date}
                y={maxPoint.fuelEfficiency}
                r={8}
                fill="var(--color-success)"
                stroke="white"
                strokeWidth={2}
                label={{
                  value: `最高: ${maxPoint.fuelEfficiency.toFixed(1)}`,
                  position: 'top',
                  fill: 'var(--color-success)',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            )}

            {/* 最低燃費マーカー */}
            {minPoint && (
              <ReferenceDot
                x={minPoint.date}
                y={minPoint.fuelEfficiency}
                r={8}
                fill="var(--color-danger)"
                stroke="white"
                strokeWidth={2}
                label={{
                  value: `最低: ${minPoint.fuelEfficiency.toFixed(1)}`,
                  position: 'bottom',
                  fill: 'var(--color-danger)',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            )}

            {/* メインデータライン */}
            <Line
              type="monotone"
              dataKey="fuelEfficiency"
              stroke="var(--color-product)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-product)' }}
              activeDot={{ r: 6 }}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
