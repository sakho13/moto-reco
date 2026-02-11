import { subMonths, subYears } from 'date-fns'
import {
  createFuelLogId,
  createMyUserBikeId,
  createTouringId,
  FuelLogId,
  MyUserBikeId,
  TouringId,
} from '@repo/shared-types'
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

    const endDate = new Date()
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
    const periodDateRange = await this.resolvePeriodDateRange(
      myUserBikeId,
      searchParams.period
    )
    const orderBy =
      searchParams.sortBy === 'refueledAt'
        ? [
            { refueledAt: searchParams.sortOrder },
            { mileage: searchParams.sortOrder },
          ]
        : [{ [searchParams.sortBy]: searchParams.sortOrder }]

    if (searchParams.period && !periodDateRange) {
      return []
    }

    const fuelLogs = await this.connection.tUserMyBikeFuelLog.findMany({
      where: {
        userMyBikeId: myUserBikeId,
        ...(periodDateRange
          ? {
              refueledAt: {
                gte: periodDateRange.startDate,
                lte: periodDateRange.endDate,
              },
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

  async findFuelLogsByDateRange(
    myUserBikeId: MyUserBikeId,
    startDate: Date,
    endDate: Date
  ): Promise<FuelLogEntity[]> {
    const fuelLogs = await this.connection.tUserMyBikeFuelLog.findMany({
      where: {
        userMyBikeId: myUserBikeId,
        refueledAt: {
          gte: startDate,
          lte: endDate,
        },
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
      orderBy: {
        refueledAt: 'asc',
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
}
