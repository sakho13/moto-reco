import {
  BikeId,
  createMyUserBikeId,
  createUserBikeId,
  UserId,
} from '@repo/shared-types'
import { GUEST_ACCOUNT_LIMITS } from '../../../statics'
import { BikeEntity } from '../entities/BikeEntity'
import { MyUserBikeEntity } from '../entities/MyUserBikeEntity'
import { UserBikeEntity } from '../entities/UserBikeEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IBikeRepository } from '../interfaces/IBikeRepository'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'
import { IUserBikeRepository } from '../interfaces/IUserBikeRepository'

// 無料プランのバイク登録上限
const FREE_PLAN_BIKE_LIMIT = 2

type RegisterUserBikeParams = {
  bikeId?: BikeId | null
  displacement?: number
  serialNumber?: string | null
  userId: UserId
  role: 'USER' | 'ADMIN' | 'GUEST'
  nickname?: string
  purchaseDate?: Date
  purchasePrice?: number
  purchaseMileage?: number
  totalMileage?: number
  isPublic?: boolean
}

type UpdateMyUserBikeParams = {
  myUserBikeId: ReturnType<typeof createMyUserBikeId>
  userId: UserId
  role: 'USER' | 'ADMIN' | 'GUEST'
  nickname?: string | null
  purchaseDate?: Date | null
  purchasePrice?: number | null
  purchaseMileage?: number | null
  displacement?: number
  totalMileage?: number | null
  isPublic?: boolean
}

export class UserBikeService {
  constructor(
    private userBikeRepository: IUserBikeRepository,
    private myUserBikeRepository: IMyUserBikeRepository,
    private bikeRepository: IBikeRepository
  ) {}

  /**
   * バイク登録数の制限をチェック
   * ゲストは1台、無料プランは2台まで登録可能
   */
  private async validateBikeRegistrationLimit(
    userId: UserId,
    role: 'USER' | 'ADMIN' | 'GUEST'
  ): Promise<void> {
    const currentCount = await this.myUserBikeRepository.countOwnedBikes(userId)
    const limit =
      role === 'GUEST' ? GUEST_ACCOUNT_LIMITS.BIKE : FREE_PLAN_BIKE_LIMIT

    if (currentCount >= limit) {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        role === 'GUEST'
          ? 'ゲストアカウントはバイクを1台まで登録できます'
          : '無料プランでは2台まで登録可能です'
      )
    }
  }

  public async registerUserBike(params: RegisterUserBikeParams) {
    // バイク登録数制限チェック
    await this.validateBikeRegistrationLimit(params.userId, params.role)

    let bike: BikeEntity | null = null
    if (params.bikeId) {
      bike = await this.bikeRepository.findById(params.bikeId)
      if (!bike) {
        throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
      }
    }

    const displacement = bike?.displacement ?? params.displacement
    if (displacement === undefined) {
      throw new ApiV1Error('INVALID_REQUEST', '排気量を指定してください')
    }

    const totalMileage = params.totalMileage ?? params.purchaseMileage ?? 0

    const userBike = await this.userBikeRepository.createUserBike(
      new UserBikeEntity({
        bikeId: bike?.id ?? null,
        userBikeId: createUserBikeId(''),
        displacement,
        totalMileage,
        serialNumber: params.serialNumber ?? null,
      })
    )

    // ゲストアカウントはバイクを公開できない
    const isPublic =
      params.role === 'GUEST' ? false : (params.isPublic ?? false)

    const myUserBike = await this.myUserBikeRepository.createMyUserBike(
      new MyUserBikeEntity({
        bikeId: userBike.bikeId,
        userBikeId: userBike.id,
        displacement: userBike.displacement,
        totalMileage: userBike.totalMileage,
        serialNumber: userBike.serialNumber,
        myUserBikeId: createMyUserBikeId(''),
        userId: params.userId,
        nickname: params.nickname ?? null,
        purchaseDate: params.purchaseDate ?? null,
        purchasePrice: params.purchasePrice ?? null,
        purchaseMileage: params.purchaseMileage ?? null,
        isPublic,
        ownedAt: params.purchaseDate ?? new Date(),
        soldAt: null,
        ownStatus: 'OWN',
      })
    )

    return { userBike, myUserBike }
  }

  public async getMyUserBikeDetail(myUserBikeId: string, userId: UserId) {
    const detail = await this.myUserBikeRepository.findMyUserBikeDetail(
      createMyUserBikeId(myUserBikeId),
      userId
    )

    if (!detail) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    return detail
  }

  public async updateMyUserBike(params: UpdateMyUserBikeParams) {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const current = myUserBike.toJson()

    if (params.displacement !== undefined) {
      if (current.bikeId) {
        throw new ApiV1Error(
          'INVALID_REQUEST',
          '登録済みバイクの排気量は変更できません'
        )
      }
      await this.userBikeRepository.updateUserBikeDisplacement(
        current.userBikeId,
        params.displacement
      )
    }

    if (params.totalMileage !== undefined && params.totalMileage !== null) {
      await this.userBikeRepository.updateTotalMileage(
        current.userBikeId,
        params.totalMileage
      )
    }

    const updatedEntity = new MyUserBikeEntity({
      ...current,
      nickname:
        params.nickname !== undefined ? params.nickname : current.nickname,
      purchaseDate:
        params.purchaseDate !== undefined
          ? params.purchaseDate
          : current.purchaseDate,
      purchasePrice:
        params.purchasePrice !== undefined
          ? params.purchasePrice
          : current.purchasePrice,
      purchaseMileage:
        params.purchaseMileage !== undefined
          ? params.purchaseMileage
          : current.purchaseMileage,
      // ゲストアカウントはバイクを公開できない
      isPublic:
        params.role === 'GUEST'
          ? false
          : params.isPublic !== undefined
            ? params.isPublic
            : current.isPublic,
    })

    await this.myUserBikeRepository.updateMyUserBike(updatedEntity)

    return this.getMyUserBikeDetail(params.myUserBikeId, params.userId)
  }
}
