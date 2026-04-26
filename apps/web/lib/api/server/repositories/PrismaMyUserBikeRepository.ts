import {
  createBikeId,
  createMyUserBikeId,
  createUserBikeId,
  createUserId,
  MyUserBikeId,
  UserId,
} from '@repo/shared-types'
import { MyUserBikeEntity } from '../entities/MyUserBikeEntity'
import {
  IMyUserBikeRepository,
  MyUserBikeDetail,
  PublicMyUserBikeDetail,
} from '../interfaces/IMyUserBikeRepository'
import { UserBikeSearchParams } from '../valueObjects/UserBikeSearchParams'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaMyUserBikeRepository
  extends PrismaRepositoryBase
  implements IMyUserBikeRepository
{
  async createMyUserBike(
    myUserBike: MyUserBikeEntity
  ): Promise<MyUserBikeEntity> {
    const created = await this.connection.tUserMyBike.create({
      data: {
        userId: myUserBike.userId,
        userBikeId: myUserBike.userBikeId,
        nickname: myUserBike.nickname,
        purchaseDate: myUserBike.purchaseDate,
        purchasePrice: myUserBike.purchasePrice,
        purchaseMileage: myUserBike.purchaseMileage,
        isPublic: myUserBike.isPublic,
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
        isPublic: true,
        ownedAt: true,
        soldAt: true,
        ownStatus: true,
        userBike: {
          select: {
            bikeId: true,
            displacement: true,
            totalMileage: true,
            serialNumber: true,
          },
        },
      },
    })

    return new MyUserBikeEntity({
      bikeId: created.userBike.bikeId
        ? createBikeId(created.userBike.bikeId)
        : null,
      userBikeId: createUserBikeId(created.userBikeId),
      displacement: created.userBike.displacement,
      totalMileage: created.userBike.totalMileage,
      serialNumber: created.userBike.serialNumber,
      myUserBikeId: createMyUserBikeId(created.id),
      userId: createUserId(created.userId),
      nickname: created.nickname,
      purchaseDate: created.purchaseDate,
      purchasePrice: created.purchasePrice,
      purchaseMileage: created.purchaseMileage,
      isPublic: created.isPublic,
      ownedAt: created.ownedAt,
      soldAt: created.soldAt,
      ownStatus: created.ownStatus,
    })
  }

  async findMyUserBikes(
    userId: UserId,
    searchParams: UserBikeSearchParams
  ): Promise<MyUserBikeDetail[]> {
    const sortByMap = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    } as const

    const myUserBikes = await this.connection.tUserMyBike.findMany({
      where: { userId, ownStatus: 'OWN' },
      include: {
        userBike: {
          select: {
            bikeId: true,
            displacement: true,
            totalMileage: true,
            bike: {
              include: {
                manufacturer: true,
              },
            },
          },
        },
        _count: {
          select: {
            fuelLogs: true,
            tourings: true,
          },
        },
      },
      orderBy: {
        [sortByMap[searchParams.sortBy]]: searchParams.sortOrder,
      },
    })

    return myUserBikes.map((myUserBike) => ({
      myUserBikeId: createMyUserBikeId(myUserBike.id),
      userBikeId: createUserBikeId(myUserBike.userBikeId),
      bikeId: myUserBike.userBike.bikeId
        ? createBikeId(myUserBike.userBike.bikeId)
        : null,
      manufacturerName: myUserBike.userBike.bike?.manufacturer.name ?? null,
      modelName: myUserBike.userBike.bike?.modelName ?? null,
      nickname: myUserBike.nickname,
      purchaseDate: myUserBike.purchaseDate,
      purchasePrice: myUserBike.purchasePrice,
      purchaseMileage: myUserBike.purchaseMileage,
      totalMileage: myUserBike.userBike.totalMileage,
      displacement:
        myUserBike.userBike.bike?.displacement ??
        myUserBike.userBike.displacement,
      modelYear: myUserBike.userBike.bike?.modelYear ?? null,
      isPublic: myUserBike.isPublic,
      createdAt: myUserBike.createdAt,
      updatedAt: myUserBike.updatedAt,
      fuelLogCount: myUserBike._count.fuelLogs,
      touringCount: myUserBike._count.tourings,
    }))
  }

  async findPublicBikes(): Promise<PublicMyUserBikeDetail[]> {
    const myUserBikes = await this.connection.tUserMyBike.findMany({
      where: { isPublic: true, ownStatus: 'OWN' },
      include: {
        userBike: {
          select: {
            displacement: true,
            totalMileage: true,
            bike: {
              include: {
                manufacturer: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return myUserBikes.map((myUserBike) => ({
      myUserBikeId: createMyUserBikeId(myUserBike.id),
      manufacturerName: myUserBike.userBike.bike?.manufacturer.name ?? null,
      modelName: myUserBike.userBike.bike?.modelName ?? null,
      nickname: myUserBike.nickname,
      displacement:
        myUserBike.userBike.bike?.displacement ??
        myUserBike.userBike.displacement,
      modelYear: myUserBike.userBike.bike?.modelYear ?? null,
      totalMileage: myUserBike.userBike.totalMileage,
      updatedAt: myUserBike.updatedAt,
    }))
  }

  async findPublicBikeById(
    myUserBikeId: MyUserBikeId
  ): Promise<PublicMyUserBikeDetail | null> {
    const myUserBike = await this.connection.tUserMyBike.findFirst({
      where: { id: myUserBikeId, isPublic: true, ownStatus: 'OWN' },
      include: {
        userBike: {
          select: {
            displacement: true,
            totalMileage: true,
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
      manufacturerName: myUserBike.userBike.bike?.manufacturer.name ?? null,
      modelName: myUserBike.userBike.bike?.modelName ?? null,
      nickname: myUserBike.nickname,
      displacement:
        myUserBike.userBike.bike?.displacement ??
        myUserBike.userBike.displacement,
      modelYear: myUserBike.userBike.bike?.modelYear ?? null,
      totalMileage: myUserBike.userBike.totalMileage,
      updatedAt: myUserBike.updatedAt,
    }
  }

  async findMyUserBikeById(
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<MyUserBikeEntity | null> {
    const myUserBike = await this.connection.tUserMyBike.findFirst({
      where: { id: myUserBikeId, userId, ownStatus: 'OWN' },
      select: {
        id: true,
        userBikeId: true,
        userId: true,
        nickname: true,
        purchaseDate: true,
        purchasePrice: true,
        purchaseMileage: true,
        isPublic: true,
        ownedAt: true,
        soldAt: true,
        ownStatus: true,
        userBike: {
          select: {
            bikeId: true,
            displacement: true,
            totalMileage: true,
            serialNumber: true,
          },
        },
      },
    })

    if (!myUserBike) {
      return null
    }

    return new MyUserBikeEntity({
      bikeId: myUserBike.userBike.bikeId
        ? createBikeId(myUserBike.userBike.bikeId)
        : null,
      userBikeId: createUserBikeId(myUserBike.userBikeId),
      displacement: myUserBike.userBike.displacement,
      totalMileage: myUserBike.userBike.totalMileage,
      serialNumber: myUserBike.userBike.serialNumber,
      myUserBikeId: createMyUserBikeId(myUserBike.id),
      userId: createUserId(myUserBike.userId),
      nickname: myUserBike.nickname,
      purchaseDate: myUserBike.purchaseDate,
      purchasePrice: myUserBike.purchasePrice,
      purchaseMileage: myUserBike.purchaseMileage,
      isPublic: myUserBike.isPublic,
      ownedAt: myUserBike.ownedAt,
      soldAt: myUserBike.soldAt,
      ownStatus: myUserBike.ownStatus,
    })
  }

  async updateMyUserBike(
    myUserBike: MyUserBikeEntity
  ): Promise<MyUserBikeEntity> {
    const updated = await this.connection.tUserMyBike.update({
      where: {
        id: myUserBike.myUserBikeId,
      },
      data: {
        nickname: myUserBike.nickname,
        purchaseDate: myUserBike.purchaseDate,
        purchasePrice: myUserBike.purchasePrice,
        purchaseMileage: myUserBike.purchaseMileage,
        isPublic: myUserBike.isPublic,
        ownedAt: myUserBike.ownedAt,
        soldAt: myUserBike.soldAt,
        ownStatus: myUserBike.ownStatus,
        userBike: {
          update: {
            totalMileage: myUserBike.totalMileage,
          },
        },
      },
      select: {
        id: true,
        userId: true,
        userBikeId: true,
        nickname: true,
        purchaseDate: true,
        purchasePrice: true,
        purchaseMileage: true,
        isPublic: true,
        ownedAt: true,
        soldAt: true,
        ownStatus: true,
        userBike: {
          select: {
            bikeId: true,
            displacement: true,
            totalMileage: true,
            serialNumber: true,
          },
        },
      },
    })

    return new MyUserBikeEntity({
      bikeId: updated.userBike.bikeId
        ? createBikeId(updated.userBike.bikeId)
        : null,
      userBikeId: createUserBikeId(updated.userBikeId),
      displacement: updated.userBike.displacement,
      totalMileage: updated.userBike.totalMileage,
      serialNumber: updated.userBike.serialNumber,
      myUserBikeId: createMyUserBikeId(updated.id),
      userId: createUserId(updated.userId),
      nickname: updated.nickname,
      purchaseDate: updated.purchaseDate,
      purchasePrice: updated.purchasePrice,
      purchaseMileage: updated.purchaseMileage,
      isPublic: updated.isPublic,
      ownedAt: updated.ownedAt,
      soldAt: updated.soldAt,
      ownStatus: updated.ownStatus,
    })
  }

  async findMyUserBikeDetail(
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<MyUserBikeDetail | null> {
    const myUserBike = await this.connection.tUserMyBike.findFirst({
      where: { id: myUserBikeId, userId, ownStatus: 'OWN' },
      include: {
        userBike: {
          select: {
            bikeId: true,
            displacement: true,
            totalMileage: true,
            bike: {
              include: {
                manufacturer: true,
              },
            },
          },
        },
        _count: {
          select: {
            fuelLogs: true,
            tourings: true,
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
      bikeId: myUserBike.userBike.bikeId
        ? createBikeId(myUserBike.userBike.bikeId)
        : null,
      manufacturerName: myUserBike.userBike.bike?.manufacturer.name ?? null,
      modelName: myUserBike.userBike.bike?.modelName ?? null,
      nickname: myUserBike.nickname,
      purchaseDate: myUserBike.purchaseDate,
      purchasePrice: myUserBike.purchasePrice,
      purchaseMileage: myUserBike.purchaseMileage,
      totalMileage: myUserBike.userBike.totalMileage,
      displacement:
        myUserBike.userBike.bike?.displacement ??
        myUserBike.userBike.displacement,
      modelYear: myUserBike.userBike.bike?.modelYear ?? null,
      isPublic: myUserBike.isPublic,
      createdAt: myUserBike.createdAt,
      updatedAt: myUserBike.updatedAt,
      fuelLogCount: myUserBike._count.fuelLogs,
      touringCount: myUserBike._count.tourings,
    }
  }

  async countOwnedBikes(userId: UserId): Promise<number> {
    return this.connection.tUserMyBike.count({
      where: {
        userId,
        ownStatus: 'OWN',
      },
    })
  }

  async findMyUserBikeTotalMileage(
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<number | null> {
    const myUserBike = await this.connection.tUserMyBike.findFirst({
      where: { id: myUserBikeId, userId, ownStatus: 'OWN' },
      select: {
        userBike: {
          select: {
            totalMileage: true,
          },
        },
      },
    })

    return myUserBike?.userBike.totalMileage ?? null
  }
}
