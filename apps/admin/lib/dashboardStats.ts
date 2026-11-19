import type { StatsPeriodDays } from '@/lib/jstPeriod'

export const DASHBOARD_METRIC_KEYS = [
  'newUsers',
  'activeUsers',
  'fuelLogs',
  'tourings',
  'maintenances',
] as const

export type DashboardMetricKey = (typeof DASHBOARD_METRIC_KEYS)[number]

export type DashboardMetricCounts = Record<DashboardMetricKey, number>

export type DashboardDailyCounts = { date: string } & DashboardMetricCounts

/** `GET /api/admin/dashboard/stats` のレスポンス */
export type DashboardStats = {
  period: { days: StatsPeriodDays; from: string; to: string }
  totals: DashboardMetricCounts
  /** 直前の同じ日数の期間の合計 */
  previous: DashboardMetricCounts
  daily: DashboardDailyCounts[]
}
