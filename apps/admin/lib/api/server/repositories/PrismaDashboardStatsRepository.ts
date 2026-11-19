import { Prisma } from '@repo/database'
import type {
  DailyCount,
  DateTimeRange,
  IDashboardStatsRepository,
} from '../interfaces/IDashboardStatsRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

const formatJstDateSql = (column: Prisma.Sql) =>
  Prisma.sql`to_char(${column} AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD')`

export class PrismaDashboardStatsRepository
  extends PrismaRepositoryBase
  implements IDashboardStatsRepository
{
  public async countDailyNewUsers(range: DateTimeRange): Promise<DailyCount[]> {
    return this._countDailyCreated(Prisma.sql`"MUser"`, range)
  }

  public async countDailyFuelLogs(range: DateTimeRange): Promise<DailyCount[]> {
    return this._countDailyCreated(Prisma.sql`"TUserMyBikeFuelLog"`, range)
  }

  public async countDailyTourings(range: DateTimeRange): Promise<DailyCount[]> {
    return this._countDailyCreated(Prisma.sql`"TUserMyBikeTouring"`, range)
  }

  public async countDailyMaintenances(
    range: DateTimeRange
  ): Promise<DailyCount[]> {
    return this._countDailyCreated(Prisma.sql`"TUserMyBikeMaintenance"`, range)
  }

  public async countDailyActiveUsers(
    range: DateTimeRange
  ): Promise<DailyCount[]> {
    return this.connection.$queryRaw<DailyCount[]>(Prisma.sql`
      WITH activity AS (${this._activitySql(range)})
      SELECT
        ${formatJstDateSql(Prisma.sql`"created_at"`)} AS "date",
        COUNT(DISTINCT "user_id")::int AS "count"
      FROM activity
      GROUP BY 1
      ORDER BY 1
    `)
  }

  public async countActiveUsers(range: DateTimeRange): Promise<number> {
    const rows = await this.connection.$queryRaw<{ count: number }[]>(
      Prisma.sql`
        WITH activity AS (${this._activitySql(range)})
        SELECT COUNT(DISTINCT "user_id")::int AS "count" FROM activity
      `
    )
    return rows[0]?.count ?? 0
  }

  private async _countDailyCreated(
    table: Prisma.Sql,
    range: DateTimeRange
  ): Promise<DailyCount[]> {
    return this.connection.$queryRaw<DailyCount[]>(Prisma.sql`
      SELECT
        ${formatJstDateSql(Prisma.sql`"created_at"`)} AS "date",
        COUNT(*)::int AS "count"
      FROM ${table}
      WHERE "created_at" >= ${range.start} AND "created_at" < ${range.end}
      GROUP BY 1
      ORDER BY 1
    `)
  }

  private _activitySql(range: DateTimeRange): Prisma.Sql {
    const record = (table: Prisma.Sql) => Prisma.sql`
      SELECT b."user_id", r."created_at"
      FROM ${table} r
      JOIN "TUserMyBike" b ON b."id" = r."my_bike_id"
      WHERE r."created_at" >= ${range.start} AND r."created_at" < ${range.end}
    `
    return Prisma.sql`
      ${record(Prisma.sql`"TUserMyBikeFuelLog"`)}
      UNION ALL
      ${record(Prisma.sql`"TUserMyBikeTouring"`)}
      UNION ALL
      ${record(Prisma.sql`"TUserMyBikeMaintenance"`)}
    `
  }
}
