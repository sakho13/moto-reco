import { Prisma } from '@repo/database'
import {
  FuelEfficiencyCalculationService,
  FuelInsightEntity,
  IFuelInsightRepository,
} from '@repo/shared-domain'
import { FuelInsightPeriod, MyUserBikeId } from '@repo/shared-types'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

type FuelInsightSourceRow = {
  id: string
  amount: number
  price: number
  mileage: number
  isFullTank: boolean
  refueledAt: Date
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

/**
 * 数値配列の単純平均を返す。空配列の場合はnull
 */
const average = (values: readonly number[]): number | null =>
  values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length

export class PrismaFuelInsightRepository
  extends PrismaRepositoryBase
  implements IFuelInsightRepository
{
  private readonly fuelEfficiencyCalculationService =
    new FuelEfficiencyCalculationService()

  /**
   * @remarks
   * `averageFuelEfficiency` は満タン法（{@link FuelEfficiencyCalculationService}）で
   * 燃費を算出できる区間（直前に満タン給油が存在し、区間距離が正の満タン給油）のみを
   * 母数にする。初回給油（直前の満タン給油が無い）は距離・給油量とも母数から除外し、
   * 継ぎ足し給油（isFullTank: false）は単独では除外しつつ、その給油量は次の満タン
   * 給油の区間に繰り込む。燃費を算出できる区間が1件も無い場合は `0` ではなく `null`
   * を返す（呼び出し側で「算出不可」を表示するため）。
   *
   * `averageAmount` / `averageTotalPrice` / `averagePricePerLiter` /
   * `minPricePerLiter` / `maxPricePerLiter` は走行距離・燃費とは無関係な
   * 「1回の給油イベントあたり」の集計のため、初回給油・継ぎ足し給油を含む
   * 期間内の給油ログ全件を母数にする（燃費が算出できるかどうかに関わらず、
   * 給油量・価格の実績としては有効な値であるため）。
   */
  async getFuelInsight(
    myUserBikeId: MyUserBikeId,
    period: FuelInsightPeriod
  ): Promise<FuelInsightEntity> {
    const rows = await this.connection.$queryRaw<FuelInsightSourceRow[]>(
      Prisma.sql`
        SELECT
          "id",
          "amount",
          "price",
          "mileage",
          "is_full_tank" AS "isFullTank",
          "refueled_at" AS "refueledAt"
        FROM "TUserMyBikeFuelLog"
        WHERE "my_bike_id" = ${myUserBikeId}
        ${buildPeriodCondition(period)}
        ORDER BY "refueled_at" DESC
        ${buildLimitClause(period)}
      `
    )

    // 満タン法の区間判定にはmileage昇順である必要がある
    const orderedByMileageAsc = [...rows].sort(
      (a, b) =>
        a.mileage - b.mileage || a.refueledAt.getTime() - b.refueledAt.getTime()
    )

    const averageFuelEfficiency =
      this.fuelEfficiencyCalculationService.calculateAverageEfficiency(
        orderedByMileageAsc.map((row) => ({
          fuelLogId: row.id,
          mileage: row.mileage,
          amount: row.amount,
          isFullTank: row.isFullTank,
        }))
      )

    // amountは常に0より大きい値が保証されている（FuelLogEntity参照）が、念のため防御的に除外する
    const pricePerLiterValues = rows
      .filter((row) => row.amount > 0)
      .map((row) => row.price / row.amount)

    return new FuelInsightEntity({
      averageFuelEfficiency,
      averageAmount: average(rows.map((row) => row.amount)),
      averageTotalPrice: average(rows.map((row) => row.price)),
      averagePricePerLiter: average(pricePerLiterValues),
      minPricePerLiter:
        pricePerLiterValues.length > 0
          ? Math.min(...pricePerLiterValues)
          : null,
      maxPricePerLiter:
        pricePerLiterValues.length > 0
          ? Math.max(...pricePerLiterValues)
          : null,
    })
  }
}
