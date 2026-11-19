import type {
  DailyCount,
  IDashboardStatsRepository,
} from '../interfaces/IDashboardStatsRepository'
import type {
  DashboardDailyCounts,
  DashboardMetricCounts,
  DashboardStats,
} from '@/lib/dashboardStats'
import {
  type StatsPeriodDays,
  getJstPeriod,
  listJstDates,
} from '@/lib/jstPeriod'

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

    const [
      newUsers,
      fuelLogs,
      tourings,
      maintenances,
      dailyActiveUsers,
      activeUsers,
      previousActiveUsers,
    ] = await Promise.all([
      this._repository.countDailyNewUsers(wholeRange),
      this._repository.countDailyFuelLogs(wholeRange),
      this._repository.countDailyTourings(wholeRange),
      this._repository.countDailyMaintenances(wholeRange),
      this._repository.countDailyActiveUsers(currentRange),
      this._repository.countActiveUsers(currentRange),
      this._repository.countActiveUsers(previousRange),
    ])

    const isCurrent = (row: DailyCount) => row.date >= period.from
    const sumCounts = (rows: DailyCount[]) =>
      rows.reduce((sum, row) => sum + row.count, 0)
    const splitTotals = (rows: DailyCount[]) => ({
      current: sumCounts(rows.filter(isCurrent)),
      previous: sumCounts(rows.filter((row) => !isCurrent(row))),
    })

    const newUsersTotals = splitTotals(newUsers)
    const fuelLogsTotals = splitTotals(fuelLogs)
    const touringsTotals = splitTotals(tourings)
    const maintenancesTotals = splitTotals(maintenances)

    const totals: DashboardMetricCounts = {
      newUsers: newUsersTotals.current,
      activeUsers,
      fuelLogs: fuelLogsTotals.current,
      tourings: touringsTotals.current,
      maintenances: maintenancesTotals.current,
    }
    const previous: DashboardMetricCounts = {
      newUsers: newUsersTotals.previous,
      activeUsers: previousActiveUsers,
      fuelLogs: fuelLogsTotals.previous,
      tourings: touringsTotals.previous,
      maintenances: maintenancesTotals.previous,
    }

    const toCountMap = (rows: DailyCount[]) =>
      new Map(rows.map((row) => [row.date, row.count]))
    const dailyMaps = {
      newUsers: toCountMap(newUsers),
      activeUsers: toCountMap(dailyActiveUsers),
      fuelLogs: toCountMap(fuelLogs),
      tourings: toCountMap(tourings),
      maintenances: toCountMap(maintenances),
    }
    const daily: DashboardDailyCounts[] = listJstDates(period.start, days).map(
      (date) => ({
        date,
        newUsers: dailyMaps.newUsers.get(date) ?? 0,
        activeUsers: dailyMaps.activeUsers.get(date) ?? 0,
        fuelLogs: dailyMaps.fuelLogs.get(date) ?? 0,
        tourings: dailyMaps.tourings.get(date) ?? 0,
        maintenances: dailyMaps.maintenances.get(date) ?? 0,
      })
    )

    return {
      period: { days, from: period.from, to: period.to },
      totals,
      previous,
      daily,
    }
  }
}
