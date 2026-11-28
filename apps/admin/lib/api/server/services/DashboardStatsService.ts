import type {
  DailyCount,
  DateTimeRange,
  IDashboardStatsRepository,
} from '../interfaces/IDashboardStatsRepository'
import {
  DASHBOARD_METRIC_KEYS,
  type DashboardDailyCounts,
  type DashboardMcpUsage,
  type DashboardMetricCounts,
  type DashboardMetricKey,
  type DashboardStats,
} from '@/lib/dashboardStats'
import {
  type StatsPeriodDays,
  getJstPeriod,
  listJstDates,
} from '@/lib/jstPeriod'

/** 登録・呼び出しの件数を日ごとに足し上げる指標（重複を除いて数える activeUsers 以外） */
type CountMetricKey = Exclude<DashboardMetricKey, 'activeUsers'>

function buildMetricCounts(
  getCount: (key: DashboardMetricKey) => number
): DashboardMetricCounts {
  return Object.fromEntries(
    DASHBOARD_METRIC_KEYS.map((key) => [key, getCount(key)])
  ) as DashboardMetricCounts
}

const sumCounts = (rows: DailyCount[]) =>
  rows.reduce((sum, row) => sum + row.count, 0)

/**
 * 管理画面ダッシュボードの期間別の統計を集計するサービス
 *
 * @remarks
 * 期間はJSTの暦日で区切り、`now` を含む日を最終日とする。
 * 件数の指標は直前の同じ日数の期間とあわせて1回で取得し、日付で振り分ける。
 */
export class DashboardStatsService {
  constructor(private readonly _repository: IDashboardStatsRepository) {}

  async getStats(now: Date, days: StatsPeriodDays): Promise<DashboardStats> {
    const period = getJstPeriod(now, days)
    const wholeRange = { start: period.previousStart, end: period.end }
    const currentRange = { start: period.start, end: period.end }
    const previousRange = { start: period.previousStart, end: period.start }

    const countFetchers: Record<
      CountMetricKey,
      (range: DateTimeRange) => Promise<DailyCount[]>
    > = {
      newUsers: (range) => this._repository.countDailyNewUsers(range),
      fuelLogs: (range) => this._repository.countDailyFuelLogs(range),
      tourings: (range) => this._repository.countDailyTourings(range),
      maintenances: (range) => this._repository.countDailyMaintenances(range),
      mcpToolCalls: (range) => this._repository.countDailyMcpToolCalls(range),
      mcpConnections: (range) =>
        this._repository.countDailyMcpConnections(range),
    }
    const countKeys = Object.keys(countFetchers) as CountMetricKey[]

    const [countRows, dailyActiveUsers, activeUsers, previousActiveUsers] =
      await Promise.all([
        Promise.all(countKeys.map((key) => countFetchers[key](wholeRange))),
        this._repository.countDailyActiveUsers(currentRange),
        this._repository.countActiveUsers(currentRange),
        this._repository.countActiveUsers(previousRange),
      ])

    const rowsByMetric = new Map<DashboardMetricKey, DailyCount[]>(
      countKeys.map((key, i) => [key, countRows[i] ?? []])
    )
    rowsByMetric.set('activeUsers', dailyActiveUsers)
    const rowsOf = (key: DashboardMetricKey) => rowsByMetric.get(key) ?? []
    const isCurrent = (row: DailyCount) => row.date >= period.from

    const totals = buildMetricCounts((key) =>
      key === 'activeUsers'
        ? activeUsers
        : sumCounts(rowsOf(key).filter(isCurrent))
    )
    const previous = buildMetricCounts((key) =>
      key === 'activeUsers'
        ? previousActiveUsers
        : sumCounts(rowsOf(key).filter((row) => !isCurrent(row)))
    )

    const countMaps = new Map(
      DASHBOARD_METRIC_KEYS.map((key) => [
        key,
        new Map(rowsOf(key).map((row) => [row.date, row.count])),
      ])
    )
    const daily: DashboardDailyCounts[] = listJstDates(period.start, days).map(
      (date) => ({
        date,
        ...buildMetricCounts((key) => countMaps.get(key)?.get(date) ?? 0),
      })
    )

    return {
      period: { days, from: period.from, to: period.to },
      totals,
      previous,
      daily,
    }
  }

  /**
   * MCPの連携状況と、期間内のツールの呼び出し状況を集計する
   */
  async getMcpUsage(
    now: Date,
    days: StatsPeriodDays
  ): Promise<DashboardMcpUsage> {
    const period = getJstPeriod(now, days)
    const range = { start: period.start, end: period.end }

    const [connections, byClient, tools, toolCallUsers] = await Promise.all([
      this._repository.countActiveMcpConnections(now),
      this._repository.countActiveMcpConnectionsByClient(now),
      this._repository.countMcpToolCallsByTool(range),
      this._repository.countMcpToolCallUsers(range),
    ])

    return {
      period: { days, from: period.from, to: period.to },
      activeConnections: { ...connections, byClient },
      toolCallUsers,
      tools,
    }
  }
}
