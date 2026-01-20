import {
  createFuelLogId,
  createMyUserBikeId,
  FuelLogId,
  MyUserBikeId,
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

    const startDate = new Date(baseDate)

    if (period === 'latest-year' || period === 'past-year') {
      startDate.setFullYear(startDate.getFullYear() - 1)
      return startDate
    }

    if (period === 'latest-month' || period === 'past-month') {
      startDate.setMonth(startDate.getMonth() - 1)
      return startDate
    }

    return null
  }

  private async resolvePeriodStartDate(
    myUserBikeId: MyUserBikeId,
    period: FuelLogSearchParams['period']
  ): Promise<Date | null> {
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

      return this.calculatePeriodStartDate(latestLog.refueledAt, period)
    }

    return this.calculatePeriodStartDate(new Date(), period)
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
    })
  }

  async findFuelLogs(
    myUserBikeId: MyUserBikeId,
    searchParams: FuelLogSearchParams
  ): Promise<FuelLogEntity[]> {
    const periodStartDate = await this.resolvePeriodStartDate(
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

    if (searchParams.period && !periodStartDate) {
      return []
    }

    const fuelLogs = await this.connection.tUserMyBikeFuelLog.findMany({
      where: {
        userMyBikeId: myUserBikeId,
        ...(periodStartDate
          ? {
              refueledAt: {
                gte: periodStartDate,
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
}
