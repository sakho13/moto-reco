import type { StatsPeriodDays } from '@/lib/jstPeriod'

export const DASHBOARD_METRIC_KEYS = [
  'newUsers',
  'activeUsers',
  'fuelLogs',
  'tourings',
  'maintenances',
  'mcpToolCalls',
  'mcpConnections',
] as const

export type DashboardMetricKey = (typeof DASHBOARD_METRIC_KEYS)[number]

export type DashboardMetricCounts = Record<DashboardMetricKey, number>

export type DashboardDailyCounts = { date: string } & DashboardMetricCounts

export type DashboardPeriod = {
  days: StatsPeriodDays
  from: string
  to: string
}

/** `GET /api/admin/dashboard/stats` のレスポンス */
export type DashboardStats = {
  period: DashboardPeriod
  totals: DashboardMetricCounts
  /** 直前の同じ日数の期間の合計 */
  previous: DashboardMetricCounts
  daily: DashboardDailyCounts[]
}

/** `GET /api/admin/dashboard/mcp-usage` のレスポンス */
export type DashboardMcpUsage = {
  period: DashboardPeriod
  /** 現在有効なMCP連携（期間によらない） */
  activeConnections: {
    users: number
    connections: number
    byClient: { clientName: string; connections: number }[]
  }
  /** 期間内にツールを呼び出したユーザーの数 */
  toolCallUsers: number
  /** 期間内のツール別の呼び出し回数（多い順） */
  tools: { toolName: string; calls: number; errors: number }[]
}
