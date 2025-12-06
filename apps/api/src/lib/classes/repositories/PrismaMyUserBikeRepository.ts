import {
  createBikeId,
  createMyUserBikeId,
  createUserBikeId,
  createUserId,
} from '@shared-types/index'
import { IMyUserBikeRepository } from '../../interfaces/IMyUserBikeRepository'
import { PrismaRepositoryBase } from '../common/PrismaRepositoryBase'
import { MyUserBikeEntity } from '../entities/MyUserBikeEntity'

export class PrismaMyUserBikeRepository
  extends PrismaRepositoryBase
  implements IMyUserBikeRepository
{
  async createMyUserBike(myUserBike: MyUserBikeEntity): Promise<MyUserBikeEntity> {
    const created = await this.connection.tUserMyBike.create({
      data: {
        userId: myUserBike.userId,
        userBikeId: myUserBike.userBikeId,
        nickname: myUserBike.nickname,
        purchaseDate: myUserBike.purchaseDate,
        purchasePrice: myUserBike.purchasePrice,
        purchaseMileage: myUserBike.purchaseMileage,
        totalMileage: myUserBike.totalMileage,
        ownedAt: myUserBike.ownedAt,
        soldAt: myUserBike.soldAt,
        ownStatus: myUserBike.ownStatus,
      },
      select: {
        id: true,
        userId: true,
        userBikeId: true,
        nickname: true,
        purchaseDate: true,
        purchasePrice: true,
        purchaseMileage: true,
        totalMileage: true,
        ownedAt: true,
        soldAt: true,
        ownStatus: true,
        userBike: {
          select: {
            bikeId: true,
          },
        },
      },
    })

    return new MyUserBikeEntity({
      bikeId: createBikeId(created.userBike.bikeId),
      userBikeId: createUserBikeId(created.userBikeId),
      myUserBikeId: createMyUserBikeId(created.id),
      userId: createUserId(created.userId),
      nickname: created.nickname,
      purchaseDate: created.purchaseDate,
      purchasePrice: created.purchasePrice,
      purchaseMileage: created.purchaseMileage,
      totalMileage: created.totalMileage,
      ownedAt: created.ownedAt,
      soldAt: created.soldAt,
      ownStatus: created.ownStatus,
    })
  }
}
