import { subMonths, subYears } from 'date-fns'
import {
  createFuelLogId,
  createMyUserBikeId,
  createTouringId,
  FuelLogId,
  MyUserBikeId,
  TouringId,
} from '@repo/shared-types'
import { getCurrentDate } from '@repo/shared-utils'
import { FuelLogEntity } from '../entities/FuelLogEntity'
import { IFuelLogRepository } from '../interfaces/IFuelLogRepository'
import { FuelLogSearchParams } from '../valueObjects/FuelLogSearchParams'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaFuelLogRepository
  extends PrismaRepositoryBase
  implements IFuelLogRepository
{
  private calculatePeriodStartDate(
    baseDate: Date,
    period: FuelLogSearchParams['period']
  ): Date | null {
    if (!period) return null

    if (period === 'latest-year' || period === 'past-year') {
      return subYears(baseDate, 1)
    }

    if (period === 'latest-month' || period === 'past-month') {
      return subMonths(baseDate, 1)
    }

    return null
  }

  private async resolvePeriodDateRange(
    myUserBikeId: MyUserBikeId,
    period: FuelLogSearchParams['period']
  ): Promise<{ startDate: Date; endDate: Date } | null> {
    if (!period) return null

    if (period === 'latest-year' || period === 'latest-month') {
      const latestLog = await this.connection.tUserMyBikeFuelLog.findFirst({
        where: {
          userMyBikeId: myUserBikeId,
        },
        select: {
          refueledAt: true,
        },
        orderBy: {
          refueledAt: 'desc',
        },
      })

      if (!latestLog) {
        return null
      }

      const endDate = latestLog.refueledAt
      const startDate = this.calculatePeriodStartDate(endDate, period)

      if (!startDate) {
        return null
      }

      return { startDate, endDate }
    }

    const endDate = getCurrentDate()
    const startDate = this.calculatePeriodStartDate(endDate, period)

    if (!startDate) {
      return null
    }

    return { startDate, endDate }
  }

  async createFuelLog(fuelLog: FuelLogEntity): Promise<FuelLogEntity> {
    const created = await this.connection.tUserMyBikeFuelLog.create({
      data: {
        userMyBikeId: fuelLog.myUserBikeId,
        amount: fuelLog.amount,
        price: fuelLog.totalPrice,
        mileage: fuelLog.mileage,
        previousMileage: fuelLog.previousMileage,
        refueledAt: fuelLog.refueledAt,
        memo: fuelLog.memo,
        touringId: fuelLog.touringId,
      },
      select: {
        id: true,
        userMyBikeId: true,
        amount: true,
        price: true,
        mileage: true,
        previousMileage: true,
        refueledAt: true,
        memo: true,
        touringId: true,
        touring: {
          select: {
            title: true,
          },
        },
      },
    })

    return new FuelLogEntity({
      fuelLogId: createFuelLogId(created.id),
      myUserBikeId: createMyUserBikeId(created.userMyBikeId),
      amount: created.amount,
      totalPrice: created.price,
      mileage: created.mileage,
      previousMileage: created.previousMileage,
      refueledAt: created.refueledAt,
      memo: created.memo,
      touringId: created.touringId ? createTouringId(created.touringId) : null,
      touringTitle: created.touring?.title ?? null,
    })
  }

  async findFuelLogs(
    myUserBikeId: MyUserBikeId,
    searchParams: FuelLogSearchParams
  ): Promise<FuelLogEntity[]> {
    // 日付範囲条件の構築
    let dateRangeCondition: { gte: Date; lte: Date } | undefined

    if (searchParams.isDateRangeMode) {
      // 日付範囲検索モード（startDate/endDate指定時）
      dateRangeCondition = {
        gte: searchParams.startDate!,
        lte: searchParams.endDate!,
      }
    } else if (searchParams.period) {
      // プリセット期間検索モード（period指定時）
      const periodDateRange = await this.resolvePeriodDateRange(
        myUserBikeId,
        searchParams.period
      )
      if (!periodDateRange) {
        return []
      }
      dateRangeCondition = {
        gte: periodDateRange.startDate,
        lte: periodDateRange.endDate,
      }
    }

    // ソート順の構築
    const orderBy =
      searchParams.sortBy === 'refueledAt'
        ? [
            { refueledAt: searchParams.sortOrder },
            { mileage: searchParams.sortOrder },
          ]
        : [{ [searchParams.sortBy]: searchParams.sortOrder }]

    // クエリ実行
    const fuelLogs = await this.connection.tUserMyBikeFuelLog.findMany({
      where: {
        userMyBikeId: myUserBikeId,
        ...(dateRangeCondition
          ? {
              refueledAt: dateRangeCondition,
            }
          : {}),
        ...(searchParams.keyword
          ? {
              OR: [
                {
                  memo: { contains: searchParams.keyword, mode: 'insensitive' },
                },
                {
                  touring: {
                    title: {
                      contains: searchParams.keyword,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        userMyBikeId: true,
        amount: true,
        price: true,
        mileage: true,
        previousMileage: true,
        refueledAt: true,
        memo: true,
        touringId: true,
        touring: {
          select: {
            title: true,
          },
        },
      },
      orderBy,
      skip: searchParams.skip,
      take: searchParams.take,
    })

    return fuelLogs.map(
      (log) =>
        new FuelLogEntity({
          fuelLogId: createFuelLogId(log.id),
          myUserBikeId: createMyUserBikeId(log.userMyBikeId),
          amount: log.amount,
          totalPrice: log.price,
          mileage: log.mileage,
          previousMileage: log.previousMileage,
          refueledAt: log.refueledAt,
          memo: log.memo,
          touringId: log.touringId ? createTouringId(log.touringId) : null,
          touringTitle: log.touring?.title ?? null,
        })
    )
  }

  async findFuelLogsByTouringId(
    touringId: TouringId,
    myUserBikeId: MyUserBikeId
  ): Promise<FuelLogEntity[]> {
    const fuelLogs = await this.connection.tUserMyBikeFuelLog.findMany({
      where: {
        touringId: touringId,
        userMyBikeId: myUserBikeId,
      },
      select: {
        id: true,
        userMyBikeId: true,
        amount: true,
        price: true,
        mileage: true,
        previousMileage: true,
        refueledAt: true,
        memo: true,
        touringId: true,
        touring: {
          select: {
            title: true,
          },
        },
      },
    })

    return fuelLogs.map(
      (log) =>
        new FuelLogEntity({
          fuelLogId: createFuelLogId(log.id),
          myUserBikeId: createMyUserBikeId(log.userMyBikeId),
          amount: log.amount,
          totalPrice: log.price,
          mileage: log.mileage,
          previousMileage: log.previousMileage,
          refueledAt: log.refueledAt,
          memo: log.memo,
          touringId: log.touringId ? createTouringId(log.touringId) : null,
          touringTitle: log.touring?.title ?? null,
        })
    )
  }

  async findFuelLogById(
    fuelLogId: FuelLogId,
    myUserBikeId: MyUserBikeId
  ): Promise<FuelLogEntity | null> {
    const fuelLog = await this.connection.tUserMyBikeFuelLog.findFirst({
      where: {
        id: fuelLogId,
        userMyBikeId: myUserBikeId,
      },
      select: {
        id: true,
        userMyBikeId: true,
        amount: true,
        price: true,
        mileage: true,
        previousMileage: true,
        refueledAt: true,
        memo: true,
        touringId: true,
        touring: {
          select: {
            title: true,
          },
        },
      },
    })

    if (!fuelLog) {
      return null
    }

    return new FuelLogEntity({
      fuelLogId: createFuelLogId(fuelLog.id),
      myUserBikeId: createMyUserBikeId(fuelLog.userMyBikeId),
      amount: fuelLog.amount,
      totalPrice: fuelLog.price,
      mileage: fuelLog.mileage,
      previousMileage: fuelLog.previousMileage,
      refueledAt: fuelLog.refueledAt,
      memo: fuelLog.memo,
      touringId: fuelLog.touringId ? createTouringId(fuelLog.touringId) : null,
      touringTitle: fuelLog.touring?.title ?? null,
    })
  }

  async updateFuelLog(fuelLog: FuelLogEntity): Promise<FuelLogEntity> {
    const updated = await this.connection.tUserMyBikeFuelLog.update({
      where: {
        id: fuelLog.id,
      },
      data: {
        amount: fuelLog.amount,
        price: fuelLog.totalPrice,
        mileage: fuelLog.mileage,
        previousMileage: fuelLog.previousMileage,
        refueledAt: fuelLog.refueledAt,
        memo: fuelLog.memo,
        touringId: fuelLog.touringId,
      },
      select: {
        id: true,
        userMyBikeId: true,
        amount: true,
        price: true,
        mileage: true,
        previousMileage: true,
        refueledAt: true,
        memo: true,
        touringId: true,
        touring: {
          select: {
            title: true,
          },
        },
      },
    })

    return new FuelLogEntity({
      fuelLogId: createFuelLogId(updated.id),
      myUserBikeId: createMyUserBikeId(updated.userMyBikeId),
      amount: updated.amount,
      totalPrice: updated.price,
      mileage: updated.mileage,
      previousMileage: updated.previousMileage,
      refueledAt: updated.refueledAt,
      memo: updated.memo,
      touringId: updated.touringId ? createTouringId(updated.touringId) : null,
      touringTitle: updated.touring?.title ?? null,
    })
  }

  async deleteFuelLog(
    fuelLogId: FuelLogId,
    myUserBikeId: MyUserBikeId
  ): Promise<void> {
    await this.connection.tUserMyBikeFuelLog.delete({
      where: {
        id: fuelLogId,
        userMyBikeId: myUserBikeId,
      },
    })
  }

  async updateFuelLogTouringId(
    fuelLogId: FuelLogId,
    myUserBikeId: MyUserBikeId,
    touringId: TouringId | null
  ): Promise<FuelLogEntity> {
    const updated = await this.connection.tUserMyBikeFuelLog.update({
      where: {
        id: fuelLogId,
        userMyBikeId: myUserBikeId,
      },
      data: {
        touringId: touringId,
      },
      select: {
        id: true,
        userMyBikeId: true,
        amount: true,
        price: true,
        mileage: true,
        previousMileage: true,
        refueledAt: true,
        memo: true,
        touringId: true,
        touring: {
          select: {
            title: true,
          },
        },
      },
    })

    return new FuelLogEntity({
      fuelLogId: createFuelLogId(updated.id),
      myUserBikeId: createMyUserBikeId(updated.userMyBikeId),
      amount: updated.amount,
      totalPrice: updated.price,
      mileage: updated.mileage,
      previousMileage: updated.previousMileage,
      refueledAt: updated.refueledAt,
      memo: updated.memo,
      touringId: updated.touringId ? createTouringId(updated.touringId) : null,
      touringTitle: updated.touring?.title ?? null,
    })
  }

  async updateMultipleFuelLogsTouringId(
    fuelLogIds: FuelLogId[],
    myUserBikeId: MyUserBikeId,
    touringId: TouringId | null
  ): Promise<void> {
    await this.connection.tUserMyBikeFuelLog.updateMany({
      where: {
        id: {
          in: fuelLogIds,
        },
        userMyBikeId: myUserBikeId,
      },
      data: {
        touringId: touringId,
      },
    })
  }

  async countFuelLogs(myUserBikeId: MyUserBikeId): Promise<number> {
    return this.connection.tUserMyBikeFuelLog.count({
      where: { userMyBikeId: myUserBikeId },
    })
  }
}
