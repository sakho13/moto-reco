import {
  createFuelLogId,
  createMyUserBikeId,
  MyUserBikeId,
} from '@shared-types/index'
import { IFuelLogRepository } from '../../interfaces/IFuelLogRepository'
import { PrismaRepositoryBase } from '../common/PrismaRepositoryBase'
import { FuelLogEntity } from '../entities/FuelLogEntity'
import { FuelLogSearchParams } from '../valueObjects/FuelLogSearchParams'

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
        refueledAt: fuelLog.refueledAt,
      },
      select: {
        id: true,
        userMyBikeId: true,
        amount: true,
        price: true,
        mileage: true,
        refueledAt: true,
      },
    })

    return new FuelLogEntity({
      fuelLogId: createFuelLogId(created.id),
      myUserBikeId: createMyUserBikeId(created.userMyBikeId),
      amount: created.amount,
      totalPrice: created.price,
      mileage: created.mileage,
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
          refueledAt: log.refueledAt,
        })
    )
  }
}
