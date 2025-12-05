import {
  createBikeId,
  createMyUserBikeId,
  createUserBikeId,
  type BikeId,
  type UserId,
} from '@shared-types/index'
import { ApiV1Error } from '../common/ApiV1Error'
import { PrismaRepositoryBase } from '../common/PrismaRepositoryBase'
import { UserBikeEntity } from '../entities/UserBikeEntity'
import { UserMyBikeEntity } from '../entities/UserMyBikeEntity'

export type RegisterUserBikeInput = {
  userId: UserId
  bikeId: BikeId
  serialNumber: string
  nickname?: string | null
  purchaseDate?: Date | null
  purchasePrice?: number | null
  purchaseMileage?: number | null
}

export type RegisterUserBikeResult = {
  userBike: UserBikeEntity
  userMyBike: UserMyBikeEntity
  bike: {
    modelName: string
    manufacturer: string
    displacement: number
    modelYear: number
  }
}

export class PrismaUserBikeRepository extends PrismaRepositoryBase {
  async findBySerialNumber(
    serialNumber: string
  ): Promise<UserBikeEntity | null> {
    const userBike = await this.connection.tUserBike.findUnique({
      where: { serialNumber },
    })

    if (!userBike) {
      return null
    }

    return new UserBikeEntity({
      userBikeId: createUserBikeId(userBike.id),
      bikeId: createBikeId(userBike.bikeId),
      serialNumber: userBike.serialNumber,
    })
  }

  async registerUserBike(
    input: RegisterUserBikeInput
  ): Promise<RegisterUserBikeResult> {
    // バイク車種の存在確認
    const bike = await this.connection.mBike.findUnique({
      where: { id: input.bikeId },
      include: { manufacturer: true },
    })

    if (!bike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイク車種が見つかりません')
    }

    // 車台番号の重複確認
    const existingUserBike = await this.connection.tUserBike.findUnique({
      where: { serialNumber: input.serialNumber },
    })

    if (existingUserBike) {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        'この車台番号は既に登録されています'
      )
    }

    // TUserBikeを作成
    const createdUserBike = await this.connection.tUserBike.create({
      data: {
        bikeId: input.bikeId,
        serialNumber: input.serialNumber,
      },
    })

    // TUserMyBikeを作成
    const now = new Date()
    const createdUserMyBike = await this.connection.tUserMyBike.create({
      data: {
        userId: input.userId,
        userBikeId: createdUserBike.id,
        nickname: input.nickname ?? null,
        purchaseDate: input.purchaseDate ?? null,
        purchasePrice: input.purchasePrice ?? null,
        purchaseMileage: input.purchaseMileage ?? null,
        totalMileage: input.purchaseMileage ?? 0,
        ownedAt: now,
        ownStatus: 'OWN',
      },
    })

    return {
      userBike: new UserBikeEntity({
        userBikeId: createUserBikeId(createdUserBike.id),
        bikeId: createBikeId(createdUserBike.bikeId),
        serialNumber: createdUserBike.serialNumber,
      }),
      userMyBike: new UserMyBikeEntity({
        myUserBikeId: createMyUserBikeId(createdUserMyBike.id),
        userBikeId: createUserBikeId(createdUserMyBike.userBikeId),
        bikeId: createBikeId(createdUserBike.bikeId),
        nickname: createdUserMyBike.nickname,
        purchaseDate: createdUserMyBike.purchaseDate,
        purchasePrice: createdUserMyBike.purchasePrice,
        purchaseMileage: createdUserMyBike.purchaseMileage,
        totalMileage: createdUserMyBike.totalMileage,
        ownedAt: createdUserMyBike.ownedAt,
        soldAt: createdUserMyBike.soldAt,
        ownStatus: createdUserMyBike.ownStatus,
      }),
      bike: {
        modelName: bike.modelName,
        manufacturer: bike.manufacturer.name,
        displacement: bike.displacement,
        modelYear: bike.modelYear,
      },
    }
  }
}
