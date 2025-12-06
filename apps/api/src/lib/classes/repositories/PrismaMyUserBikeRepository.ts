import {
  createBikeId,
  createMyUserBikeId,
  createUserBikeId,
  createUserId,
  MyUserBikeId,
  UserId,
} from '@shared-types/index'
import {
  IMyUserBikeRepository,
  MyUserBikeDetail,
} from '../../interfaces/IMyUserBikeRepository'
import { PrismaRepositoryBase } from '../common/PrismaRepositoryBase'
import { MyUserBikeEntity } from '../entities/MyUserBikeEntity'
import { ApiV1Error } from '../common/ApiV1Error'

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

  async findMyUserBikes(userId: UserId): Promise<MyUserBikeDetail[]> {
    const myUserBikes = await this.connection.tUserMyBike.findMany({
      where: { userId, ownStatus: 'OWN' },
      include: {
        userBike: {
          include: {
            bike: {
              include: {
                manufacturer: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return myUserBikes.map((myUserBike) => ({
      myUserBikeId: createMyUserBikeId(myUserBike.id),
      userBikeId: createUserBikeId(myUserBike.userBikeId),
      bikeId: createBikeId(myUserBike.userBike.bikeId),
      manufacturerName: myUserBike.userBike.bike.manufacturer.name,
      modelName: myUserBike.userBike.bike.modelName,
      nickname: myUserBike.nickname,
      purchaseDate: myUserBike.purchaseDate,
      totalMileage: myUserBike.totalMileage,
      displacement: myUserBike.userBike.bike.displacement,
      modelYear: myUserBike.userBike.bike.modelYear,
      createdAt: myUserBike.createdAt,
      updatedAt: myUserBike.updatedAt,
    }))
  }

  async findMyUserBikeById(
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<MyUserBikeDetail | null> {
    const myUserBike = await this.connection.tUserMyBike.findFirst({
      where: { id: myUserBikeId, userId, ownStatus: 'OWN' },
      include: {
        userBike: {
          include: {
            bike: {
              include: {
                manufacturer: true,
              },
            },
          },
        },
      },
    })

    if (!myUserBike) {
      return null
    }

    return {
      myUserBikeId: createMyUserBikeId(myUserBike.id),
      userBikeId: createUserBikeId(myUserBike.userBikeId),
      bikeId: createBikeId(myUserBike.userBike.bikeId),
      manufacturerName: myUserBike.userBike.bike.manufacturer.name,
      modelName: myUserBike.userBike.bike.modelName,
      nickname: myUserBike.nickname,
      purchaseDate: myUserBike.purchaseDate,
      totalMileage: myUserBike.totalMileage,
      displacement: myUserBike.userBike.bike.displacement,
      modelYear: myUserBike.userBike.bike.modelYear,
      createdAt: myUserBike.createdAt,
      updatedAt: myUserBike.updatedAt,
    }
  }

  async updateTotalMileage(
    myUserBikeId: MyUserBikeId,
    totalMileage: number
  ): Promise<void> {
    const updated = await this.connection.tUserMyBike.update({
      where: { id: myUserBikeId },
      data: { totalMileage },
      select: { id: true },
    })

    if (!updated) {
      throw new ApiV1Error('NOT_FOUND', 'ユーザー所有バイクが見つかりません')
    }
  }
}
