import { createFuelLogId, createMyUserBikeId } from '@shared-types/index'
import { IFuelLogRepository } from '../../interfaces/IFuelLogRepository'
import { PrismaRepositoryBase } from '../common/PrismaRepositoryBase'
import { FuelLogEntity } from '../entities/FuelLogEntity'

export class PrismaFuelLogRepository extends PrismaRepositoryBase implements IFuelLogRepository {
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
}
