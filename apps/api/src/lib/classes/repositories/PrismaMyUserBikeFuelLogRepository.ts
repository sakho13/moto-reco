import {
  createMyUserBikeFuelLogId,
  createMyUserBikeId,
  MyUserBikeId,
} from '@shared-types/index'
import { IMyUserBikeFuelLogRepository } from '../../interfaces/IMyUserBikeFuelLogRepository'
import { PrismaRepositoryBase } from '../common/PrismaRepositoryBase'
import { MyUserBikeFuelLogEntity } from '../entities/MyUserBikeFuelLogEntity'

export class PrismaMyUserBikeFuelLogRepository
  extends PrismaRepositoryBase
  implements IMyUserBikeFuelLogRepository
{
  async createFuelLog(
    myUserBikeId: MyUserBikeId,
    fuelLog: MyUserBikeFuelLogEntity
  ): Promise<MyUserBikeFuelLogEntity> {
    const created = await this.connection.tUserMyBikeFuelLog.create({
      data: {
        userMyBikeId: myUserBikeId,
        amount: fuelLog.amount,
        price: fuelLog.totalPrice,
        mileage: fuelLog.mileage,
        refueledAt: fuelLog.refueledAt,
      },
    })

    return new MyUserBikeFuelLogEntity({
      fuelLogId: createMyUserBikeFuelLogId(created.id),
      myUserBikeId: createMyUserBikeId(created.userMyBikeId),
      refueledAt: created.refueledAt,
      mileage: created.mileage,
      amount: created.amount,
      totalPrice: created.price,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
  }
}
