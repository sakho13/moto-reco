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
  async createFuelLog(fuelLog: FuelLogEntity): Promise<FuelLogEntity> {
    const created = await this.connection.tUserMyBikeFuelLog.create({
      data: {
        userMyBikeId: fuelLog.myUserBikeId,
        amount: fuelLog.amount,
        price: fuelLog.totalPrice,
        mileage: fuelLog.mileage,
        previousMileage: fuelLog.previousMileage,
        refueledAt: fuelLog.refueledAt,
      },
      select: {
        id: true,
        userMyBikeId: true,
        amount: true,
        price: true,
        mileage: true,
        previousMileage: true,
        refueledAt: true,
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
    })
  }

  async findFuelLogs(
    myUserBikeId: MyUserBikeId,
    searchParams: FuelLogSearchParams
  ): Promise<FuelLogEntity[]> {
    const sortByMap = {
      refueledAt: 'refueledAt',
      mileage: 'mileage',
    } as const

    const fuelLogs = await this.connection.tUserMyBikeFuelLog.findMany({
      where: {
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
      },
      orderBy: {
        [sortByMap[searchParams.sortBy]]: searchParams.sortOrder,
      },
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
      },
      select: {
        id: true,
        userMyBikeId: true,
        amount: true,
        price: true,
        mileage: true,
        previousMileage: true,
        refueledAt: true,
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
    })
  }
}
