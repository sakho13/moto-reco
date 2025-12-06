import { createBikeId, type BikeId, type UserId } from '@shared-types/index'
import { ApiV1Error } from '../common/ApiV1Error'
import { PrismaRepositoryBase } from '../common/PrismaRepositoryBase'

export type RegisterUserBikeInput = {
  userId: UserId
  bikeId: BikeId
  nickname?: string | null
  purchaseDate?: Date | null
  mileage?: number | null
}

export type RegisterUserBikeResult = {
  userBikeId: string
  manufacturerName: string
  bikeId: string
  modelName: string
  nickname: string | null
  purchaseDate: Date | null
  totalMileage: number
  displacement: number
  modelYear: number
  createdAt: Date
  updatedAt: Date
}

export class PrismaUserBikeRepository extends PrismaRepositoryBase {
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

    // TUserBikeを作成（serialNumberは自動生成）
    const createdUserBike = await this.connection.tUserBike.create({
      data: {
        bikeId: input.bikeId,
        serialNumber: crypto.randomUUID(),
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
        purchaseMileage: input.mileage ?? null,
        totalMileage: input.mileage ?? 0,
        ownedAt: now,
        ownStatus: 'OWN',
      },
    })

    return {
      userBikeId: createdUserMyBike.id,
      manufacturerName: bike.manufacturer.name,
      bikeId: createBikeId(createdUserBike.bikeId),
      modelName: bike.modelName,
      nickname: createdUserMyBike.nickname,
      purchaseDate: createdUserMyBike.purchaseDate,
      totalMileage: createdUserMyBike.totalMileage,
      displacement: bike.displacement,
      modelYear: bike.modelYear,
      createdAt: createdUserMyBike.createdAt,
      updatedAt: createdUserMyBike.updatedAt,
    }
  }
}
