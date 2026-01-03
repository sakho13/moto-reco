import { Prisma } from '@repo/database'
import { FuelInsightPeriod, MyUserBikeId } from '@repo/shared-types'
import { FuelInsightEntity } from '../entities/FuelInsightEntity'
import { IFuelInsightRepository } from '../interfaces/IFuelInsightRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

type FuelInsightRow = {
  averageFuelEfficiency: number | null
  averageAmount: number | null
  averageTotalPrice: number | null
  averagePricePerLiter: number | null
  minPricePerLiter: number | null
  maxPricePerLiter: number | null
}

const buildPeriodCondition = (period: FuelInsightPeriod) => {
  switch (period) {
    case 'past-month':
      return Prisma.sql`AND "refueled_at" >= NOW() - INTERVAL '1 month'`
    case 'past-half-year':
      return Prisma.sql`AND "refueled_at" >= NOW() - INTERVAL '6 months'`
    case 'past-year':
      return Prisma.sql`AND "refueled_at" >= NOW() - INTERVAL '1 year'`
    case 'all':
    case 'last-5':
    default:
      return Prisma.empty
  }
}

const buildLimitClause = (period: FuelInsightPeriod) =>
  period === 'last-5' ? Prisma.sql`LIMIT 5` : Prisma.empty

export class PrismaFuelInsightRepository
  extends PrismaRepositoryBase
  implements IFuelInsightRepository
{
  async getFuelInsight(
    myUserBikeId: MyUserBikeId,
    period: FuelInsightPeriod
  ): Promise<FuelInsightEntity> {
    const rows = await this.connection.$queryRaw<FuelInsightRow[]>(
      Prisma.sql`
        WITH filtered AS (
          SELECT
            "amount",
            "price",
            "mileage",
            "previous_mileage",
            "refueled_at"
          FROM "TUserMyBikeFuelLog"
          WHERE "my_bike_id" = ${myUserBikeId}
          ${buildPeriodCondition(period)}
          ORDER BY "refueled_at" DESC
          ${buildLimitClause(period)}
        ),
        stats AS (
          SELECT
            SUM(GREATEST("mileage" - "previous_mileage", 0))::float AS total_distance,
            SUM("amount")::float AS total_amount,
            AVG("amount")::float AS average_amount,
            AVG("price")::float AS average_price,
            AVG("price"::float / NULLIF("amount", 0)) AS average_price_per_liter,
            MIN("price"::float / NULLIF("amount", 0)) AS min_price_per_liter,
            MAX("price"::float / NULLIF("amount", 0)) AS max_price_per_liter
          FROM filtered
        )
        SELECT
          CASE
            WHEN total_amount IS NULL OR total_amount = 0 THEN NULL
            ELSE total_distance / total_amount
          END AS "averageFuelEfficiency",
          average_amount AS "averageAmount",
          average_price AS "averageTotalPrice",
          average_price_per_liter AS "averagePricePerLiter",
          min_price_per_liter AS "minPricePerLiter",
          max_price_per_liter AS "maxPricePerLiter"
        FROM stats
      `
    )

    const [row] = rows

    return new FuelInsightEntity({
      averageFuelEfficiency: row?.averageFuelEfficiency ?? null,
      averageAmount: row?.averageAmount ?? null,
      averageTotalPrice: row?.averageTotalPrice ?? null,
      averagePricePerLiter: row?.averagePricePerLiter ?? null,
      minPricePerLiter: row?.minPricePerLiter ?? null,
      maxPricePerLiter: row?.maxPricePerLiter ?? null,
    })
  }
}
